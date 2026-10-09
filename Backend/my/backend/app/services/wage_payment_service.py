from datetime import datetime, date, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.attendance import Attendance, AttendanceStatus
from app.models.work_order import WorkOrderVersion
from app.models.payment import PaymentRecord, PaymentStatus, PaymentMethod
from app.models.user import User, UserRole
from app.schemas.payment import WageCalculationResponse, PaymentRecordCreateRequest
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

class WagePaymentService:
    @staticmethod
    def calculate_wage_for_attendance(db: Session, attendance_id: int) -> WageCalculationResponse:
        att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        if not att:
            raise ResourceNotFound("Attendance record not found")

        assignment = att.assignment
        wo = assignment.work_order

        # Get the latest confirmed version
        version = db.query(WorkOrderVersion).filter(
            WorkOrderVersion.work_order_id == wo.id,
            WorkOrderVersion.worker_confirmed == True
        ).order_by(WorkOrderVersion.version_number.desc()).first()

        if not version:
            # Fallback to current version
            version = db.query(WorkOrderVersion).filter(
                WorkOrderVersion.work_order_id == wo.id
            ).order_by(WorkOrderVersion.version_number.desc()).first()

        daily_rate = version.agreed_wage_rate if version else 0.0
        version_num = version.version_number if version else 1

        # Wage calculation logic
        if att.attendance_status == AttendanceStatus.PRESENT:
            calculated_amount = daily_rate
        elif att.attendance_status == AttendanceStatus.ABSENT:
            calculated_amount = 0.0
        elif att.attendance_status == AttendanceStatus.PENDING_CONFIRMATION:
            calculated_amount = daily_rate  # Potential due upon confirmation
        else:
            calculated_amount = 0.0

        return WageCalculationResponse(
            attendance_id=att.id,
            worker_id=att.worker_id,
            worker_name=att.worker.user.name,
            date=att.date,
            attendance_status=att.attendance_status.value,
            daily_rate=daily_rate,
            calculated_amount=calculated_amount,
            work_order_version=version_num,
            note="Wage calculated strictly from confirmed attendance record. KaamConnect does not disburse or hold worker funds."
        )

    @staticmethod
    def record_payment(
        db: Session,
        actor_user: User,
        data: PaymentRecordCreateRequest
    ) -> PaymentRecord:
        # Resolve attendance and assignment
        contractor = None
        if data.attendance_id:
            att = db.query(Attendance).filter(Attendance.id == data.attendance_id).first()
            if not att:
                raise ResourceNotFound("Referenced attendance record not found")
            assignment_id = att.assignment_id
            worker_id = att.worker_id
            wage_calc = WagePaymentService.calculate_wage_for_attendance(db, att.id)
            agreed_amount = data.agreed_amount or wage_calc.daily_rate
            amount_due = wage_calc.calculated_amount
            contractor = att.assignment.work_order.contractor
        elif data.assignment_id and data.worker_id:
            assignment_id = data.assignment_id
            worker_id = data.worker_id
            agreed_amount = data.agreed_amount or 0.0
            amount_due = agreed_amount
            asgn = db.query(Assignment).filter(Assignment.id == assignment_id).first()
            contractor = asgn.work_order.contractor if asgn else None
        else:
            raise ResourceNotFound("Must specify attendance_id or (assignment_id, worker_id, agreed_amount)")

        if contractor and actor_user.role != UserRole.ADMIN and contractor.user_id != actor_user.id:
            raise UnauthorizedResource("Only the responsible contractor can record payments")

        now = datetime.now(timezone.utc)
        pay_date = data.payment_date or now.date()

        # Idempotency / duplicate check for attendance payment
        if data.attendance_id:
            existing_pay = db.query(PaymentRecord).filter(
                PaymentRecord.attendance_id == data.attendance_id
            ).first()
            if existing_pay:
                existing_pay.amount_reported_paid = data.amount_reported_paid
                existing_pay.payment_status = PaymentStatus.REPORTED_PAID if data.amount_reported_paid > 0 else PaymentStatus.PENDING
                existing_pay.payment_reference = data.payment_reference or existing_pay.payment_reference
                existing_pay.payment_method = data.payment_method or existing_pay.payment_method
                db.commit()
                db.refresh(existing_pay)
                return existing_pay

        status = PaymentStatus.REPORTED_PAID if data.amount_reported_paid >= amount_due else PaymentStatus.PARTIALLY_PAID
        if data.amount_reported_paid == 0:
            status = PaymentStatus.PENDING

        record = PaymentRecord(
            worker_id=worker_id,
            assignment_id=assignment_id,
            attendance_id=data.attendance_id,
            agreed_amount=agreed_amount,
            amount_due=amount_due,
            amount_reported_paid=data.amount_reported_paid,
            payment_date=pay_date,
            payment_method=data.payment_method,
            payment_reference=data.payment_reference,
            payment_status=status,
            supporting_evidence=data.supporting_evidence,
            notes=data.notes
        )
        db.add(record)
        db.flush()

        AuditService.log(
            db=db,
            actor_id=actor_user.id,
            entity_type="PAYMENT_RECORD",
            entity_id=record.id,
            action="PAYMENT_RECORDED",
            new_value={
                "amount_due": amount_due,
                "amount_reported_paid": data.amount_reported_paid,
                "status": status.value,
                "reference": data.payment_reference
            },
            reason="Contractor recorded payment transaction info"
        )

        db.commit()
        db.refresh(record)
        return record

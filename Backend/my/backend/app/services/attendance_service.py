from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.attendance import Attendance, AttendanceStatus, ConfirmationMethod
from app.models.assignment import Assignment, AssignmentStatus
from app.models.user import User, UserRole
from app.services.audit_service import AuditService
from app.utils.exceptions import (
    ResourceNotFound, UnauthorizedResource, AttendanceAlreadyCheckedIn,
    AttendanceAlreadyConfirmed
)

class AttendanceService:
    @staticmethod
    def check_in(
        db: Session,
        assignment_id: int,
        worker_user: User,
        confirmation_method: ConfirmationMethod = ConfirmationMethod.APP,
        check_in_date: Optional[date] = None,
        notes: Optional[str] = None
    ) -> Attendance:
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise ResourceNotFound("Assignment not found")

        # Verify assignment belongs to worker
        if assignment.worker.user_id != worker_user.id:
            raise UnauthorizedResource("Cannot check in for another worker's assignment")

        if assignment.status != AssignmentStatus.ACTIVE:
            raise UnauthorizedResource(f"Assignment is not active (status: {assignment.status.value})")

        today = check_in_date or datetime.now(timezone.utc).date()

        # Idempotency check: does attendance already exist for this date?
        existing = db.query(Attendance).filter(
            Attendance.assignment_id == assignment_id,
            Attendance.date == today
        ).first()

        if existing:
            if existing.check_in_time is not None:
                raise AttendanceAlreadyCheckedIn(f"Worker has already checked in for {today.isoformat()}")
            existing.check_in_time = datetime.now(timezone.utc)
            existing.confirmation_method = confirmation_method
            db.commit()
            db.refresh(existing)
            return existing

        now = datetime.now(timezone.utc)
        att = Attendance(
            assignment_id=assignment.id,
            worker_id=assignment.worker_id,
            date=today,
            check_in_time=now,
            worker_confirmed=True,
            supervisor_confirmed=False,
            attendance_status=AttendanceStatus.PENDING_CONFIRMATION,
            confirmation_method=confirmation_method,
            notes=notes
        )
        db.add(att)
        db.flush()

        AuditService.log(
            db=db,
            actor_id=worker_user.id,
            entity_type="ATTENDANCE",
            entity_id=att.id,
            action="ATTENDANCE_CHECKED_IN",
            new_value={"date": today.isoformat(), "method": confirmation_method.value},
            reason="Worker checked in"
        )

        db.commit()
        db.refresh(att)
        return att

    @staticmethod
    def check_out(
        db: Session,
        attendance_id: int,
        worker_user: User,
        notes: Optional[str] = None
    ) -> Attendance:
        att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        if not att:
            raise ResourceNotFound("Attendance record not found")

        if att.worker.user_id != worker_user.id:
            raise UnauthorizedResource("Cannot check out for another worker")

        now = datetime.now(timezone.utc)
        att.check_out_time = now
        if notes:
            att.notes = f"{att.notes or ''}; Out: {notes}"

        AuditService.log(
            db=db,
            actor_id=worker_user.id,
            entity_type="ATTENDANCE",
            entity_id=att.id,
            action="ATTENDANCE_CHECKED_OUT",
            new_value={"check_out_time": now.isoformat()},
            reason="Worker checked out"
        )

        db.commit()
        db.refresh(att)
        return att

    @staticmethod
    def confirm_attendance(
        db: Session,
        attendance_id: int,
        confirmer_user: User,
        status: AttendanceStatus = AttendanceStatus.PRESENT,
        notes: Optional[str] = None
    ) -> Attendance:
        att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        if not att:
            raise ResourceNotFound("Attendance record not found")

        assignment = att.assignment
        contractor = assignment.work_order.contractor
        is_contractor = contractor.user_id == confirmer_user.id
        is_supervisor = confirmer_user.role == UserRole.SUPERVISOR
        is_admin = confirmer_user.role == UserRole.ADMIN

        if not (is_contractor or is_supervisor or is_admin):
            raise UnauthorizedResource("Only the contractor, supervisor, or admin can confirm attendance")

        att.attendance_status = status
        att.supervisor_confirmed = True
        att.confirmed_by = confirmer_user.id
        if notes:
            att.notes = f"{att.notes or ''}; Confirmed: {notes}"

        AuditService.log(
            db=db,
            actor_id=confirmer_user.id,
            entity_type="ATTENDANCE",
            entity_id=att.id,
            action="ATTENDANCE_CONFIRMED",
            new_value={"status": status.value, "confirmed_by": confirmer_user.id},
            reason=notes or "Supervisor/contractor confirmed attendance"
        )

        db.commit()
        db.refresh(att)
        return att

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.dispute import Dispute, DisputeResponse, DisputeStatus, DisputeType
from app.models.user import User, UserRole
from app.models.assignment import Assignment
from app.models.attendance import Attendance
from app.models.payment import PaymentRecord, PaymentStatus
from app.schemas.dispute import DisputeCreateRequest, DisputeResponseRequest, DisputeResolveRequest
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource, DisputeAlreadyResolved

class DisputeService:
    @staticmethod
    def create_dispute(
        db: Session,
        actor_user: User,
        data: DisputeCreateRequest
    ) -> Dispute:
        # Resolve worker_id & contractor_id
        worker_id = data.worker_id
        contractor_id = data.contractor_id

        if data.attendance_id:
            att = db.query(Attendance).filter(Attendance.id == data.attendance_id).first()
            if att:
                worker_id = att.worker_id
                contractor_id = att.assignment.work_order.contractor_id

        if data.payment_id:
            pay = db.query(PaymentRecord).filter(PaymentRecord.id == data.payment_id).first()
            if pay:
                worker_id = pay.worker_id
                contractor_id = pay.assignment.work_order.contractor_id
                pay.payment_status = PaymentStatus.DISPUTED

        if data.assignment_id and (not worker_id or not contractor_id):
            asgn = db.query(Assignment).filter(Assignment.id == data.assignment_id).first()
            if asgn:
                worker_id = asgn.worker_id
                contractor_id = asgn.work_order.contractor_id

        if not worker_id or not contractor_id:
            raise ResourceNotFound("Must provide valid assignment, attendance, or explicit worker & contractor IDs")

        dispute = Dispute(
            raised_by=actor_user.id,
            worker_id=worker_id,
            contractor_id=contractor_id,
            assignment_id=data.assignment_id,
            attendance_id=data.attendance_id,
            payment_id=data.payment_id,
            dispute_type=data.dispute_type,
            description=data.description,
            status=DisputeStatus.OPEN
        )
        db.add(dispute)
        db.flush()

        AuditService.log(
            db=db,
            actor_id=actor_user.id,
            entity_type="DISPUTE",
            entity_id=dispute.id,
            action="DISPUTE_RAISED",
            new_value={"type": data.dispute_type.value, "description": data.description},
            reason="Party raised formal dispute"
        )

        db.commit()
        db.refresh(dispute)
        return dispute

    @staticmethod
    def add_response(
        db: Session,
        dispute_id: int,
        responder_user: User,
        data: DisputeResponseRequest
    ) -> DisputeResponse:
        dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
        if not dispute:
            raise ResourceNotFound("Dispute not found")

        resp = DisputeResponse(
            dispute_id=dispute.id,
            responder_id=responder_user.id,
            message=data.message,
            evidence_reference=data.evidence_reference
        )
        db.add(resp)
        if dispute.status == DisputeStatus.OPEN:
            dispute.status = DisputeStatus.UNDER_REVIEW

        db.commit()
        db.refresh(resp)
        return resp

    @staticmethod
    def resolve_dispute(
        db: Session,
        dispute_id: int,
        resolver_user: User,
        data: DisputeResolveRequest
    ) -> Dispute:
        dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
        if not dispute:
            raise ResourceNotFound("Dispute not found")

        # Only supervisor or admin or mutual contractor/worker can resolve formally
        if resolver_user.role not in [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONTRACTOR]:
            raise UnauthorizedResource("Insufficient authorization to resolve this dispute")

        if dispute.status in [DisputeStatus.RESOLVED, DisputeStatus.WITHDRAWN]:
            raise DisputeAlreadyResolved("This dispute is already closed or resolved")

        now = datetime.now(timezone.utc)
        dispute.status = data.status
        dispute.resolution = data.resolution
        dispute.resolved_by = resolver_user.id
        dispute.resolved_at = now

        # Update linked payment if relevant
        if dispute.payment_id:
            pay = db.query(PaymentRecord).filter(PaymentRecord.id == dispute.payment_id).first()
            if pay and data.status == DisputeStatus.RESOLVED:
                pay.payment_status = PaymentStatus.RESOLVED

        AuditService.log(
            db=db,
            actor_id=resolver_user.id,
            entity_type="DISPUTE",
            entity_id=dispute.id,
            action="DISPUTE_RESOLVED",
            new_value={"status": data.status.value, "resolution": data.resolution},
            reason="Dispute formally resolved"
        )

        db.commit()
        db.refresh(dispute)
        return dispute

from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.offer import JobOffer, OfferStatus, WorkerContactRelease
from app.models.requirement import LabourRequirementItem, ItemStatus
from app.models.worker import Worker, WorkerAvailability
from app.models.work_order import WorkOrder, WorkOrderVersion, WorkOrderStatus
from app.models.assignment import Assignment, AssignmentStatus
from app.models.user import User
from app.services.audit_service import AuditService
from app.utils.exceptions import (
    ResourceNotFound, UnauthorizedResource, OfferExpired,
    OfferAlreadyAccepted, OfferAlreadyProcessed, WorkerNotAvailable
)

class OfferService:
    @staticmethod
    def create_offer(
        db: Session,
        requirement_item_id: int,
        worker_id: int,
        contractor_user: User,
        expires_in_hours: int = 24
    ) -> JobOffer:
        item = db.query(LabourRequirementItem).filter(LabourRequirementItem.id == requirement_item_id).first()
        if not item:
            raise ResourceNotFound("Labour requirement item not found")

        # Verify contractor owns the requirement
        if item.requirement.contractor.user_id != contractor_user.id:
            raise UnauthorizedResource("Cannot create offer for another contractor's requirement")

        worker = db.query(Worker).filter(Worker.id == worker_id).first()
        if not worker:
            raise ResourceNotFound("Worker not found")

        # Check existing pending offer
        existing_offer = db.query(JobOffer).filter(
            JobOffer.requirement_item_id == requirement_item_id,
            JobOffer.worker_id == worker_id,
            JobOffer.status == OfferStatus.PENDING
        ).first()
        if existing_offer:
            return existing_offer

        offer = JobOffer(
            requirement_item_id=requirement_item_id,
            worker_id=worker_id,
            offered_wage=item.wage_rate,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=expires_in_hours),
            status=OfferStatus.PENDING
        )
        db.add(offer)
        db.flush()

        AuditService.log(
            db=db,
            actor_id=contractor_user.id,
            entity_type="JOB_OFFER",
            entity_id=offer.id,
            action="OFFER_CREATED",
            new_value={"worker_id": worker_id, "wage": item.wage_rate, "requirement_item_id": requirement_item_id},
            reason="Offer extended to candidate worker"
        )
        db.commit()
        db.refresh(offer)
        return offer

    @staticmethod
    def accept_offer(
        db: Session,
        offer_id: int,
        worker_user_id: Optional[int] = None,
        is_automated_system: bool = False
    ) -> Dict[str, Any]:
        """
        Transactional acceptance flow:
        Verifies offer, marks accepted, creates work order & assignment,
        updates requirement item count, updates worker availability,
        releases contact number to contractor, and logs audit events.
        """
        offer = db.query(JobOffer).filter(JobOffer.id == offer_id).with_for_update().first()
        if not offer:
            raise ResourceNotFound(f"Job offer #{offer_id} not found")

        # Verify ownership unless automated voice system callback
        if not is_automated_system and worker_user_id is not None:
            if offer.worker.user_id != worker_user_id:
                raise UnauthorizedResource("Cannot accept an offer addressed to another worker")

        if offer.status == OfferStatus.ACCEPTED:
            raise OfferAlreadyAccepted("This job offer has already been accepted.")
        if offer.status != OfferStatus.PENDING:
            raise OfferAlreadyProcessed(f"Offer is no longer pending (current status: {offer.status.value})")

        # Expiry check
        now = datetime.now(timezone.utc)
        if offer.expires_at.tzinfo is None:
            expires_at_utc = offer.expires_at.replace(tzinfo=timezone.utc)
        else:
            expires_at_utc = offer.expires_at

        if now > expires_at_utc:
            offer.status = OfferStatus.EXPIRED
            db.commit()
            raise OfferExpired("Job offer has expired.")

        worker = offer.worker
        if worker.availability_status not in [WorkerAvailability.AVAILABLE, WorkerAvailability.ASSIGNED]:
            raise WorkerNotAvailable(f"Worker is currently {worker.availability_status.value}")

        item = offer.requirement_item
        req = item.requirement
        contractor = req.contractor

        try:
            # 1. Mark offer accepted
            offer.status = OfferStatus.ACCEPTED
            offer.responded_at = now

            # 2. Create Digital Work Order
            work_order = WorkOrder(
                requirement_item_id=item.id,
                contractor_id=contractor.id,
                worker_id=worker.id,
                project_id=req.project_id,
                site_id=req.site_id,
                trade_id=item.trade_id,
                role_title=f"{item.trade.name} - {item.skill.name}",
                status=WorkOrderStatus.ACTIVE,
                acceptance_timestamp=now
            )
            db.add(work_order)
            db.flush()

            # 3. Create initial Work Order Version 1
            wo_version = WorkOrderVersion(
                work_order_id=work_order.id,
                version_number=1,
                agreed_wage_rate=offer.offered_wage,
                wage_period=item.wage_period.value,
                start_date=req.required_start_date,
                end_date=req.required_end_date,
                working_schedule=req.work_schedule,
                terms_text=f"Agreed rate ₹{offer.offered_wage}/{item.wage_period.value}. Project: {req.project.name}, Site: {req.site.name}.",
                changed_by=worker.user_id,
                reason="Initial agreed contract upon worker acceptance",
                worker_confirmed=True,
                confirmed_at=now
            )
            db.add(wo_version)
            db.flush()

            work_order.current_version_id = wo_version.id

            # 4. Create Assignment
            assignment = Assignment(
                work_order_id=work_order.id,
                worker_id=worker.id,
                project_id=req.project_id,
                site_id=req.site_id,
                start_date=req.required_start_date,
                end_date=req.required_end_date,
                status=AssignmentStatus.ACTIVE
            )
            db.add(assignment)
            db.flush()

            # 5. Release worker contact to contractor
            contact_release = WorkerContactRelease(
                worker_id=worker.id,
                contractor_id=contractor.id,
                offer_id=offer.id,
                released_at=now,
                release_reason="Worker accepted job offer"
            )
            db.add(contact_release)

            # 6. Update requirement filled count
            item.filled_quantity += 1
            if item.filled_quantity >= item.quantity_required:
                item.status = ItemStatus.FILLED
            else:
                item.status = ItemStatus.PARTIALLY_FILLED

            # 7. Update worker availability
            worker.availability_status = WorkerAvailability.WORKING

            # 8. Record audit trail
            AuditService.log(
                db=db,
                actor_id=worker.user_id,
                entity_type="JOB_OFFER",
                entity_id=offer.id,
                action="OFFER_ACCEPTED",
                new_value={"offer_id": offer.id, "worker_id": worker.id, "status": "ACCEPTED"},
                reason="Worker accepted offer"
            )

            AuditService.log(
                db=db,
                actor_id=worker.user_id,
                entity_type="WORK_ORDER",
                entity_id=work_order.id,
                action="WORK_ORDER_CREATED",
                new_value={"work_order_id": work_order.id, "version": 1, "wage_rate": offer.offered_wage},
                reason="Digital work order initialized from offer acceptance"
            )

            AuditService.log(
                db=db,
                actor_id=worker.user_id,
                entity_type="WORKER_CONTACT",
                entity_id=worker.id,
                action="WORKER_CONTACT_RELEASED",
                new_value={"contractor_id": contractor.id, "worker_id": worker.id, "phone_released": True},
                reason="Worker contact released to contractor upon job acceptance"
            )

            db.commit()
            db.refresh(offer)
            db.refresh(work_order)
            db.refresh(assignment)

            return {
                "offer_id": offer.id,
                "work_order_id": work_order.id,
                "assignment_id": assignment.id,
                "worker_id": worker.id,
                "worker_name": worker.user.name,
                "worker_phone": worker.user.phone_number,
                "status": "ACCEPTED"
            }
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def reject_offer(
        db: Session,
        offer_id: int,
        worker_user_id: Optional[int] = None,
        is_automated_system: bool = False
    ) -> JobOffer:
        offer = db.query(JobOffer).filter(JobOffer.id == offer_id).with_for_update().first()
        if not offer:
            raise ResourceNotFound(f"Job offer #{offer_id} not found")

        if not is_automated_system and worker_user_id is not None:
            if offer.worker.user_id != worker_user_id:
                raise UnauthorizedResource("Cannot reject an offer addressed to another worker")

        if offer.status != OfferStatus.PENDING:
            raise OfferAlreadyProcessed(f"Offer is no longer pending (current status: {offer.status.value})")

        now = datetime.now(timezone.utc)
        offer.status = OfferStatus.REJECTED
        offer.responded_at = now

        AuditService.log(
            db=db,
            actor_id=offer.worker.user_id,
            entity_type="JOB_OFFER",
            entity_id=offer.id,
            action="OFFER_REJECTED",
            new_value={"status": "REJECTED"},
            reason="Worker rejected offer. Contact not released."
        )

        db.commit()
        db.refresh(offer)
        return offer

    @staticmethod
    def cancel_offer(db: Session, offer_id: int, actor_user: User) -> JobOffer:
        offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
        if not offer:
            raise ResourceNotFound(f"Job offer #{offer_id} not found")

        if offer.status != OfferStatus.PENDING:
            raise OfferAlreadyProcessed("Only pending offers can be cancelled")

        offer.status = OfferStatus.CANCELLED
        AuditService.log(
            db=db,
            actor_id=actor_user.id,
            entity_type="JOB_OFFER",
            entity_id=offer.id,
            action="OFFER_CANCELLED",
            reason="Offer cancelled by contractor/admin"
        )
        db.commit()
        db.refresh(offer)
        return offer

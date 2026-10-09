from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.assignment import Assignment, AssignmentStatus
from app.models.worker import Worker, WorkerAvailability
from app.models.work_order import WorkOrder
from app.models.user import User
from app.services.matching_service import MatchingService
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource
from app.schemas.matching import WorkerMatchItem

class AssignmentService:
    @staticmethod
    def cancel_assignment(
        db: Session,
        assignment_id: int,
        actor_user: User,
        reason: str
    ) -> Assignment:
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise ResourceNotFound("Assignment not found")

        # Authorization check
        is_contractor = assignment.work_order.contractor.user_id == actor_user.id
        is_worker = assignment.worker.user_id == actor_user.id
        is_admin = actor_user.role.value == "ADMIN"
        if not (is_contractor or is_worker or is_admin):
            raise UnauthorizedResource("Not authorized to cancel this assignment")

        assignment.status = AssignmentStatus.CANCELLED
        assignment.replacement_reason = reason

        # Reset worker availability
        assignment.worker.availability_status = WorkerAvailability.AVAILABLE

        AuditService.log(
            db=db,
            actor_id=actor_user.id,
            entity_type="ASSIGNMENT",
            entity_id=assignment.id,
            action="ASSIGNMENT_CANCELLED",
            new_value={"status": "CANCELLED", "reason": reason},
            reason=reason
        )

        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def request_replacement(
        db: Session,
        assignment_id: int,
        contractor_user: User,
        reason: str
    ) -> Dict[str, Any]:
        """
        Marks original assignment as REPLACED (never deleted),
        updates worker availability, records audit log, and
        returns matched replacement candidates.
        """
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise ResourceNotFound("Assignment not found")

        wo = assignment.work_order
        if wo.contractor.user_id != contractor_user.id and contractor_user.role.value != "ADMIN":
            raise UnauthorizedResource("Only the assigning contractor can request a replacement")

        # Never delete original assignment
        assignment.status = AssignmentStatus.REPLACED
        assignment.replacement_reason = reason

        # Original worker is marked available (or on leave / updated reliability)
        original_worker = assignment.worker
        original_worker.availability_status = WorkerAvailability.AVAILABLE

        # Log replacement audit trail
        AuditService.log(
            db=db,
            actor_id=contractor_user.id,
            entity_type="ASSIGNMENT",
            entity_id=assignment.id,
            action="WORKER_REPLACEMENT_REQUESTED",
            old_value={"worker_id": original_worker.id, "status": "ACTIVE"},
            new_value={"status": "REPLACED", "reason": reason},
            reason=reason
        )

        db.commit()
        db.refresh(assignment)

        # Run matching to find suitable candidate replacements
        suitable_workers: List[WorkerMatchItem] = []
        if wo.requirement_item_id:
            req_item = wo.requirement_item
            req = req_item.requirement
            for worker in db.query(Worker).filter(Worker.id != original_worker.id).all():
                eval_res = MatchingService.evaluate_worker(
                    db=db,
                    worker=worker,
                    item=req_item,
                    req=req,
                    is_preferred=False
                )
                if eval_res.match_status == "MATCHED":
                    suitable_workers.append(eval_res)

        return {
            "original_assignment_id": assignment.id,
            "status": "REPLACED",
            "reason": reason,
            "suitable_replacements": suitable_workers
        }

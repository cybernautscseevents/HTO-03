from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.work_order import WorkOrder, WorkOrderVersion, WorkOrderStatus
from app.models.user import User
from app.schemas.work_order import WorkOrderVersionCreateRequest
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource, InvalidWorkOrderVersion

class WorkOrderService:
    @staticmethod
    def create_revised_version(
        db: Session,
        work_order_id: int,
        modifier_user: User,
        data: WorkOrderVersionCreateRequest
    ) -> WorkOrderVersion:
        wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
        if not wo:
            raise ResourceNotFound("Work order not found")

        # Only contractor or admin can propose revision
        if modifier_user.role.value != "ADMIN" and wo.contractor.user_id != modifier_user.id:
            raise UnauthorizedResource("Only the assigning contractor or admin can revise work order terms")

        # Get latest version
        latest_version = db.query(WorkOrderVersion).filter(
            WorkOrderVersion.work_order_id == work_order_id
        ).order_by(WorkOrderVersion.version_number.desc()).first()

        new_version_num = (latest_version.version_number + 1) if latest_version else 1
        now = datetime.now(timezone.utc)

        start_date = data.start_date or (latest_version.start_date if latest_version else None)
        end_date = data.end_date or (latest_version.end_date if latest_version else None)
        schedule = data.working_schedule or (latest_version.working_schedule if latest_version else "08:00-17:00")
        period = data.wage_period or (latest_version.wage_period if latest_version else "DAILY")

        if not start_date or not end_date:
            raise InvalidWorkOrderVersion("Work order version must contain valid start and end dates")

        new_version = WorkOrderVersion(
            work_order_id=wo.id,
            version_number=new_version_num,
            agreed_wage_rate=data.wage_rate,
            wage_period=period,
            start_date=start_date,
            end_date=end_date,
            working_schedule=schedule,
            terms_text=data.terms_text or f"Revised rate to ₹{data.wage_rate}/{period}. Reason: {data.reason}",
            changed_by=modifier_user.id,
            changed_at=now,
            reason=data.reason,
            worker_confirmed=False  # Requires worker confirmation!
        )
        db.add(new_version)
        wo.status = WorkOrderStatus.REVISED
        db.flush()

        AuditService.log(
            db=db,
            actor_id=modifier_user.id,
            entity_type="WORK_ORDER",
            entity_id=wo.id,
            action="WORK_ORDER_REVISED",
            old_value={"version": latest_version.version_number, "rate": latest_version.agreed_wage_rate} if latest_version else None,
            new_value={"version": new_version_num, "rate": data.wage_rate, "reason": data.reason},
            reason=data.reason
        )

        db.commit()
        db.refresh(new_version)
        return new_version

    @staticmethod
    def confirm_version(
        db: Session,
        version_id: int,
        worker_user: User
    ) -> WorkOrderVersion:
        version = db.query(WorkOrderVersion).filter(WorkOrderVersion.id == version_id).first()
        if not version:
            raise ResourceNotFound("Work order version not found")

        wo = version.work_order
        if wo.worker.user_id != worker_user.id:
            raise UnauthorizedResource("Only the assigned worker can confirm revised terms")

        if version.worker_confirmed:
            return version  # Already confirmed

        now = datetime.now(timezone.utc)
        version.worker_confirmed = True
        version.confirmed_at = now
        wo.current_version_id = version.id
        wo.status = WorkOrderStatus.ACTIVE

        AuditService.log(
            db=db,
            actor_id=worker_user.id,
            entity_type="WORK_ORDER_VERSION",
            entity_id=version.id,
            action="WORK_ORDER_VERSION_CONFIRMED",
            new_value={"version_number": version.version_number, "confirmed_at": now.isoformat()},
            reason="Worker confirmed revised work order terms"
        )

        db.commit()
        db.refresh(version)
        return version

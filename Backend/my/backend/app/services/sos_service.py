from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.sos import SOSAlert, SOSStatus
from app.models.worker import Worker
from app.models.user import User
from app.schemas.sos import SOSTriggerRequest
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound

class SOSService:
    @staticmethod
    def trigger_sos(db: Session, worker: Worker, data: SOSTriggerRequest) -> SOSAlert:
        now = datetime.now(timezone.utc)
        has_loc = bool(data.location_reference and len(data.location_reference.strip()) > 0)
        
        alert = SOSAlert(
            worker_id=worker.id,
            project_id=data.project_id,
            site_id=data.site_id,
            assignment_id=data.assignment_id,
            triggered_at=now,
            location_available=has_loc,
            location_reference=data.location_reference,  # Textual description, NO GPS!
            status=SOSStatus.TRIGGERED
        )
        db.add(alert)
        db.flush()

        AuditService.log(
            db=db,
            actor_id=worker.user_id,
            entity_type="SOS_ALERT",
            entity_id=alert.id,
            action="SOS_TRIGGERED",
            new_value={"worker_id": worker.id, "location": data.location_reference},
            reason="Worker triggered emergency SOS"
        )

        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def update_status(
        db: Session,
        sos_id: int,
        actor_user: User,
        new_status: SOSStatus,
        notes: Optional[str] = None
    ) -> SOSAlert:
        alert = db.query(SOSAlert).filter(SOSAlert.id == sos_id).first()
        if not alert:
            raise ResourceNotFound("SOS alert not found")

        now = datetime.now(timezone.utc)
        alert.status = new_status
        if notes:
            alert.resolution_notes = f"{alert.resolution_notes or ''}; {notes}".strip("; ")

        if new_status == SOSStatus.ACKNOWLEDGED:
            alert.acknowledged_by = actor_user.id
            alert.acknowledged_at = now
        elif new_status in [SOSStatus.RESOLVED, SOSStatus.FALSE_ALARM]:
            alert.resolved_by = actor_user.id
            alert.resolved_at = now

        AuditService.log(
            db=db,
            actor_id=actor_user.id,
            entity_type="SOS_ALERT",
            entity_id=alert.id,
            action=f"SOS_{new_status.value}",
            new_value={"status": new_status.value, "notes": notes},
            reason=f"SOS alert updated to {new_status.value}"
        )

        db.commit()
        db.refresh(alert)
        return alert

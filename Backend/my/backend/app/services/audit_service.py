from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

class AuditService:
    @staticmethod
    def log(
        db: Session,
        entity_type: str,
        entity_id: int,
        action: str,
        actor_id: Optional[int] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None
    ) -> AuditLog:
        entry = AuditLog(
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(entry)
        # We flush so it participates in the active transaction
        db.flush()
        return entry

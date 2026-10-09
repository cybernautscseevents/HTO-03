from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse
from app.schemas.common import StandardResponse

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("/{entity_type}/{entity_id}", response_model=StandardResponse[List[AuditLogResponse]])
def get_audit_trail(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.CONTRACTOR, UserRole.SUPERVISOR])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).filter(
        AuditLog.entity_type == entity_type.upper(),
        AuditLog.entity_id == entity_id
    ).order_by(AuditLog.timestamp.asc()).all()

    results = []
    for l in logs:
        results.append(AuditLogResponse(
            id=l.id,
            actor_id=l.actor_id,
            actor_name=l.actor.name if l.actor else "SYSTEM",
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            action=l.action,
            old_value=l.old_value,
            new_value=l.new_value,
            reason=l.reason,
            timestamp=l.timestamp
        ))

    return StandardResponse(data=results, message="Audit trail fetched successfully")

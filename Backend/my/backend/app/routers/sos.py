from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role, get_current_worker
from app.models.user import User, UserRole
from app.models.worker import Worker
from app.models.sos import SOSAlert, SOSStatus
from app.schemas.sos import SOSTriggerRequest, SOSAlertResponse
from app.schemas.common import StandardResponse
from app.services.sos_service import SOSService
from app.utils.exceptions import ResourceNotFound

router = APIRouter(prefix="/sos", tags=["Emergency SOS"])

def serialize_sos(alert: SOSAlert) -> SOSAlertResponse:
    return SOSAlertResponse(
        id=alert.id,
        worker_id=alert.worker_id,
        worker_name=alert.worker.user.name if (alert.worker and alert.worker.user) else None,
        project_id=alert.project_id,
        site_id=alert.site_id,
        assignment_id=alert.assignment_id,
        triggered_at=alert.triggered_at,
        location_available=alert.location_available,
        location_reference=alert.location_reference,
        status=alert.status,
        acknowledged_by=alert.acknowledged_by,
        acknowledged_at=alert.acknowledged_at,
        resolved_by=alert.resolved_by,
        resolved_at=alert.resolved_at,
        resolution_notes=alert.resolution_notes,
        created_at=alert.created_at
    )

@router.post("", response_model=StandardResponse[SOSAlertResponse], status_code=status.HTTP_201_CREATED)
def trigger_sos(
    req: SOSTriggerRequest,
    worker: Worker = Depends(get_current_worker),
    db: Session = Depends(get_db)
):
    alert = SOSService.trigger_sos(db, worker, req)
    return StandardResponse(data=serialize_sos(alert), message="Emergency SOS triggered immediately (Works without GPS)")

@router.get("/{sos_id}", response_model=StandardResponse[SOSAlertResponse])
def get_sos_alert(
    sos_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(SOSAlert).filter(SOSAlert.id == sos_id).first()
    if not alert:
        raise ResourceNotFound("SOS alert not found")
    return StandardResponse(data=serialize_sos(alert), message="SOS alert details fetched")

@router.post("/{sos_id}/acknowledge", response_model=StandardResponse[SOSAlertResponse])
def acknowledge_sos(
    sos_id: int,
    notes: str = Query("Acknowledged by site supervisor", description="Notes on response"),
    current_user: User = Depends(require_role([UserRole.SUPERVISOR, UserRole.CONTRACTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    alert = SOSService.update_status(db, sos_id, current_user, SOSStatus.ACKNOWLEDGED, notes)
    return StandardResponse(data=serialize_sos(alert), message="SOS acknowledged")

@router.post("/{sos_id}/escalate", response_model=StandardResponse[SOSAlertResponse])
def escalate_sos(
    sos_id: int,
    notes: str = Query("Escalated to project safety lead", description="Escalation notes"),
    current_user: User = Depends(require_role([UserRole.SUPERVISOR, UserRole.CONTRACTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    alert = SOSService.update_status(db, sos_id, current_user, SOSStatus.ESCALATED, notes)
    return StandardResponse(data=serialize_sos(alert), message="SOS escalated")

@router.post("/{sos_id}/resolve", response_model=StandardResponse[SOSAlertResponse])
def resolve_sos(
    sos_id: int,
    notes: str = Query("Worker assisted, emergency secured", description="Resolution outcome"),
    current_user: User = Depends(require_role([UserRole.SUPERVISOR, UserRole.CONTRACTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    alert = SOSService.update_status(db, sos_id, current_user, SOSStatus.RESOLVED, notes)
    return StandardResponse(data=serialize_sos(alert), message="SOS resolved")

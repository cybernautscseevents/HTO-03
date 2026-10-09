from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.worker import Worker
from app.models.contractor import Contractor
from app.models.incident import Incident
from app.schemas.incident import IncidentCreateRequest, IncidentUpdateRequest, IncidentResolveRequest, IncidentResponse
from app.schemas.common import StandardResponse
from app.services.incident_service import IncidentService
from app.utils.exceptions import ResourceNotFound

router = APIRouter(prefix="/incidents", tags=["Incidents & Safety"])

def serialize_incident(inc: Incident) -> IncidentResponse:
    return IncidentResponse(
        id=inc.id,
        worker_id=inc.worker_id,
        worker_name=inc.worker.user.name if (inc.worker and inc.worker.user) else None,
        contractor_id=inc.contractor_id,
        project_id=inc.project_id,
        project_name=inc.project.name if inc.project else None,
        site_id=inc.site_id,
        site_name=inc.site.name if inc.site else None,
        assignment_id=inc.assignment_id,
        incident_type=inc.incident_type,
        description=inc.description,
        timestamp=inc.timestamp,
        witnesses=inc.witnesses,
        worker_statement=inc.worker_statement,
        supervisor_statement=inc.supervisor_statement,
        evidence_reference=inc.evidence_reference,
        status=inc.status,
        resolution=inc.resolution,
        resolved_by=inc.resolved_by,
        resolved_at=inc.resolved_at,
        created_at=inc.created_at,
        updated_at=inc.updated_at
    )

@router.post("", response_model=StandardResponse[IncidentResponse], status_code=status.HTTP_201_CREATED)
def report_incident(
    req: IncidentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inc = IncidentService.create_incident(db, current_user, req)
    return StandardResponse(data=serialize_incident(inc), message="Site incident reported successfully")

@router.get("", response_model=StandardResponse[List[IncidentResponse]])
def list_incidents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if current_user.role == UserRole.WORKER:
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker:
            return StandardResponse(data=[], message="No worker profile")
        query = query.filter(Incident.worker_id == worker.id)
    elif current_user.role == UserRole.CONTRACTOR:
        contractor = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
        if not contractor:
            return StandardResponse(data=[], message="No contractor profile")
        query = query.filter(Incident.contractor_id == contractor.id)

    incidents = query.order_by(Incident.timestamp.desc()).all()
    return StandardResponse(data=[serialize_incident(i) for i in incidents], message="Incidents fetched")

@router.get("/{incident_id}", response_model=StandardResponse[IncidentResponse])
def get_incident(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise ResourceNotFound("Incident not found")
    return StandardResponse(data=serialize_incident(inc), message="Incident fetched")

@router.patch("/{incident_id}", response_model=StandardResponse[IncidentResponse])
def update_incident(
    incident_id: int,
    req: IncidentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inc = IncidentService.update_incident(db, incident_id, current_user, req)
    return StandardResponse(data=serialize_incident(inc), message="Incident updated")

@router.post("/{incident_id}/resolve", response_model=StandardResponse[IncidentResponse])
def resolve_incident(
    incident_id: int,
    req: IncidentResolveRequest,
    current_user: User = Depends(require_role([UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.CONTRACTOR])),
    db: Session = Depends(get_db)
):
    inc = IncidentService.resolve_incident(db, incident_id, current_user, req)
    return StandardResponse(data=serialize_incident(inc), message="Incident resolved")

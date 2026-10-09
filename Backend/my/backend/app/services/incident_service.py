from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.incident import Incident, IncidentStatus, IncidentType
from app.models.user import User, UserRole
from app.models.project import Project
from app.schemas.incident import IncidentCreateRequest, IncidentUpdateRequest, IncidentResolveRequest
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

class IncidentService:
    @staticmethod
    def create_incident(db: Session, actor_user: User, data: IncidentCreateRequest) -> Incident:
        project = db.query(Project).filter(Project.id == data.project_id).first()
        if not project:
            raise ResourceNotFound("Project not found")

        now = data.timestamp or datetime.now(timezone.utc)
        incident = Incident(
            worker_id=data.worker_id,
            contractor_id=project.contractor_id,
            project_id=data.project_id,
            site_id=data.site_id,
            assignment_id=data.assignment_id,
            incident_type=data.incident_type,
            description=data.description,
            timestamp=now,
            witnesses=data.witnesses,
            worker_statement=data.worker_statement,
            supervisor_statement=data.supervisor_statement,
            evidence_reference=data.evidence_reference,
            status=IncidentStatus.REPORTED
        )
        db.add(incident)
        db.flush()

        AuditService.log(
            db=db,
            actor_id=actor_user.id,
            entity_type="INCIDENT",
            entity_id=incident.id,
            action="INCIDENT_REPORTED",
            new_value={"type": data.incident_type.value, "description": data.description},
            reason="Site safety incident reported"
        )

        db.commit()
        db.refresh(incident)
        return incident

    @staticmethod
    def update_incident(db: Session, incident_id: int, actor_user: User, data: IncidentUpdateRequest) -> Incident:
        inc = db.query(Incident).filter(Incident.id == incident_id).first()
        if not inc:
            raise ResourceNotFound("Incident not found")

        if data.status:
            inc.status = data.status
        if data.witnesses:
            inc.witnesses = data.witnesses
        if data.worker_statement:
            inc.worker_statement = data.worker_statement
        if data.supervisor_statement:
            inc.supervisor_statement = data.supervisor_statement
        if data.evidence_reference:
            inc.evidence_reference = data.evidence_reference

        db.commit()
        db.refresh(inc)
        return inc

    @staticmethod
    def resolve_incident(db: Session, incident_id: int, resolver_user: User, data: IncidentResolveRequest) -> Incident:
        inc = db.query(Incident).filter(Incident.id == incident_id).first()
        if not inc:
            raise ResourceNotFound("Incident not found")

        now = datetime.now(timezone.utc)
        inc.status = IncidentStatus.RESOLVED
        inc.resolution = data.resolution
        inc.resolved_by = resolver_user.id
        inc.resolved_at = now

        AuditService.log(
            db=db,
            actor_id=resolver_user.id,
            entity_type="INCIDENT",
            entity_id=inc.id,
            action="INCIDENT_RESOLVED",
            new_value={"resolution": data.resolution},
            reason="Incident resolved by authorized personnel"
        )

        db.commit()
        db.refresh(inc)
        return inc

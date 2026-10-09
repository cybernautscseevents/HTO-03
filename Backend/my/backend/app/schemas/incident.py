from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.incident import IncidentType, IncidentStatus

class IncidentCreateRequest(BaseModel):
    worker_id: Optional[int] = None
    project_id: int
    site_id: int
    assignment_id: Optional[int] = None
    incident_type: IncidentType
    description: str = Field(..., min_length=5)
    timestamp: Optional[datetime] = None
    witnesses: Optional[str] = None
    worker_statement: Optional[str] = None
    supervisor_statement: Optional[str] = None
    evidence_reference: Optional[str] = None

class IncidentUpdateRequest(BaseModel):
    status: Optional[IncidentStatus] = None
    witnesses: Optional[str] = None
    worker_statement: Optional[str] = None
    supervisor_statement: Optional[str] = None
    evidence_reference: Optional[str] = None

class IncidentResolveRequest(BaseModel):
    resolution: str = Field(..., min_length=5)

class IncidentResponse(BaseModel):
    id: int
    worker_id: Optional[int] = None
    worker_name: Optional[str] = None
    contractor_id: int
    project_id: int
    project_name: Optional[str] = None
    site_id: int
    site_name: Optional[str] = None
    assignment_id: Optional[int] = None
    incident_type: IncidentType
    description: str
    timestamp: datetime
    witnesses: Optional[str] = None
    worker_statement: Optional[str] = None
    supervisor_statement: Optional[str] = None
    evidence_reference: Optional[str] = None
    status: IncidentStatus
    resolution: Optional[str] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

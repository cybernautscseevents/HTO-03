from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.sos import SOSStatus

class SOSTriggerRequest(BaseModel):
    project_id: Optional[int] = None
    site_id: Optional[int] = None
    assignment_id: Optional[int] = None
    location_reference: Optional[str] = None  # Textual landmark / site location, NO GPS

class SOSStatusUpdateRequest(BaseModel):
    status: SOSStatus
    resolution_notes: Optional[str] = None

class SOSAlertResponse(BaseModel):
    id: int
    worker_id: int
    worker_name: Optional[str] = None
    project_id: Optional[int] = None
    site_id: Optional[int] = None
    assignment_id: Optional[int] = None
    triggered_at: datetime
    location_available: bool
    location_reference: Optional[str] = None
    status: SOSStatus
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.assignment import AssignmentStatus
from app.schemas.matching import WorkerMatchItem

class AssignmentResponse(BaseModel):
    id: int
    work_order_id: int
    worker_id: int
    worker_name: Optional[str] = None
    project_id: int
    project_name: Optional[str] = None
    site_id: int
    site_name: Optional[str] = None
    start_date: date
    end_date: date
    status: AssignmentStatus
    replacement_reason: Optional[str] = None
    replaced_by_assignment_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReplacementRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="e.g. Worker no-show, health issue, or departure")

class ReplacementResponse(BaseModel):
    original_assignment_id: int
    status: str = "REPLACED"
    reason: str
    suitable_replacements: List[WorkerMatchItem] = []

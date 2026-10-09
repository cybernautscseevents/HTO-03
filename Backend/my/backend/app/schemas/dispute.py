from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.dispute import DisputeType, DisputeStatus

class DisputeCreateRequest(BaseModel):
    dispute_type: DisputeType
    worker_id: Optional[int] = None
    contractor_id: Optional[int] = None
    assignment_id: Optional[int] = None
    attendance_id: Optional[int] = None
    payment_id: Optional[int] = None
    description: str = Field(..., min_length=5)

class DisputeResponseRequest(BaseModel):
    message: str = Field(..., min_length=3)
    evidence_reference: Optional[str] = None

class DisputeResolveRequest(BaseModel):
    status: DisputeStatus = DisputeStatus.RESOLVED
    resolution: str = Field(..., min_length=5)

class DisputeResponseSchema(BaseModel):
    id: int
    dispute_id: int
    responder_id: int
    responder_name: Optional[str] = None
    message: str
    evidence_reference: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DisputeDetailResponse(BaseModel):
    id: int
    raised_by: int
    raised_by_name: Optional[str] = None
    worker_id: int
    worker_name: Optional[str] = None
    contractor_id: int
    contractor_name: Optional[str] = None
    assignment_id: Optional[int] = None
    attendance_id: Optional[int] = None
    payment_id: Optional[int] = None
    dispute_type: DisputeType
    description: str
    status: DisputeStatus
    resolution: Optional[str] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    responses: List[DisputeResponseSchema] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

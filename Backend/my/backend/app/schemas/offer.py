from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.offer import OfferStatus

class JobOfferCreateRequest(BaseModel):
    requirement_item_id: int
    worker_id: int
    expires_in_hours: int = 24

class JobOfferResponse(BaseModel):
    id: int
    requirement_item_id: int
    worker_id: int
    worker_name: Optional[str] = None
    trade_name: Optional[str] = None
    skill_name: Optional[str] = None
    offered_wage: float
    status: OfferStatus
    expires_at: datetime
    created_at: datetime
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WorkerContactResponse(BaseModel):
    worker_id: int
    worker_name: str
    phone_number: str
    released_at: datetime
    reason: str

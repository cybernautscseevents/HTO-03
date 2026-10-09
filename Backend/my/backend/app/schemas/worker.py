from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.worker import WorkerAvailability, WorkerVerificationStatus
from app.schemas.trade_skill import WorkerSkillResponse

class WorkerCreateRequest(BaseModel):
    preferred_language: str = "hi"
    home_region: Optional[str] = None
    current_work_region: Optional[str] = None
    expected_daily_wage: Optional[float] = Field(None, ge=0)

class WorkerUpdateRequest(BaseModel):
    preferred_language: Optional[str] = None
    home_region: Optional[str] = None
    current_work_region: Optional[str] = None
    expected_daily_wage: Optional[float] = Field(None, ge=0)
    profile_status: Optional[str] = None

class WorkerAvailabilityUpdateRequest(BaseModel):
    status: WorkerAvailability

class WorkerResponse(BaseModel):
    id: int
    user_id: int
    name: str
    phone_number: str  # Only returned when authorized
    preferred_language: str
    home_region: Optional[str] = None
    current_work_region: Optional[str] = None
    expected_daily_wage: Optional[float] = None
    availability_status: WorkerAvailability
    profile_status: str
    verification_status: WorkerVerificationStatus
    skills: List[WorkerSkillResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkerPublicResponse(BaseModel):
    id: int
    user_id: int
    name: str
    phone_number_masked: str = "******"
    preferred_language: str
    current_work_region: Optional[str] = None
    availability_status: WorkerAvailability
    verification_status: WorkerVerificationStatus
    skills: List[WorkerSkillResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

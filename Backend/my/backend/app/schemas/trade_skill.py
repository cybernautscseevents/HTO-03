from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.trade_skill import SkillLevel, VerificationStatus

class TradeCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    description: Optional[str] = None

class TradeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SkillCreateRequest(BaseModel):
    trade_id: int
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

class SkillResponse(BaseModel):
    id: int
    trade_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WorkerSkillCreateRequest(BaseModel):
    skill_id: int
    skill_level: int = Field(..., ge=1, le=4, description="1=Beginner, 2=Intermediate, 3=Advanced, 4=Expert")
    verification_status: VerificationStatus = VerificationStatus.SELF_DECLARED
    evidence_reference: Optional[str] = None

class WorkerSkillUpdateRequest(BaseModel):
    skill_level: Optional[int] = Field(None, ge=1, le=4)
    evidence_reference: Optional[str] = None

class WorkerSkillVerifyRequest(BaseModel):
    verification_status: VerificationStatus
    evidence_reference: Optional[str] = None

class WorkerSkillResponse(BaseModel):
    id: int
    worker_id: int
    skill_id: int
    skill_name: Optional[str] = None
    trade_name: Optional[str] = None
    skill_level: int
    verification_status: VerificationStatus
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    evidence_reference: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

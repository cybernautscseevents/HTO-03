from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field

class TeamMemberCreateRequest(BaseModel):
    trade_id: int
    skill_id: Optional[int] = None
    minimum_skill_level: int = Field(1, ge=1, le=4)
    quantity: int = Field(1, gt=0)

class TeamMemberResponse(BaseModel):
    id: int
    trade_id: int
    trade_name: Optional[str] = None
    skill_id: Optional[int] = None
    skill_name: Optional[str] = None
    minimum_skill_level: int
    quantity: int

    class Config:
        from_attributes = True

class TeamCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    members: List[TeamMemberCreateRequest] = []

class TeamResponse(BaseModel):
    id: int
    contractor_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    members: List[TeamMemberResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

class TeamRequirementExpandRequest(BaseModel):
    team_id: int
    team_count: int = Field(..., gt=0)
    project_id: int
    site_id: int
    required_start_date: date
    required_end_date: date
    default_wage_rate: float = Field(..., ge=0)

class PreferredWorkerCreateRequest(BaseModel):
    worker_id: int
    notes: Optional[str] = None

class PreferredWorkerResponse(BaseModel):
    id: int
    contractor_id: int
    worker_id: int
    worker_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

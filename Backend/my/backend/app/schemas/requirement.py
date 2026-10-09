from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.requirement import RequirementStatus, WagePeriod, ItemStatus

class LabourRequirementItemCreateRequest(BaseModel):
    trade_id: int
    skill_id: int
    minimum_skill_level: int = Field(..., ge=1, le=4, description="1=Beginner, 2=Intermediate, 3=Advanced, 4=Expert")
    quantity_required: int = Field(..., gt=0)
    wage_rate: float = Field(..., ge=0)
    wage_period: WagePeriod = WagePeriod.DAILY
    duration: Optional[str] = "3 months"
    schedule: Optional[str] = "08:00-17:00"

class LabourRequirementCreateRequest(BaseModel):
    project_id: int
    site_id: int
    required_start_date: date
    required_end_date: date
    work_schedule: str = "08:00-17:00"
    items: List[LabourRequirementItemCreateRequest]

class LabourRequirementItemResponse(BaseModel):
    id: int
    requirement_id: int
    trade_id: int
    trade_name: Optional[str] = None
    skill_id: int
    skill_name: Optional[str] = None
    minimum_skill_level: int
    quantity_required: int
    wage_rate: float
    wage_period: WagePeriod
    duration: Optional[str] = None
    schedule: Optional[str] = None
    filled_quantity: int
    status: ItemStatus
    created_at: datetime

    class Config:
        from_attributes = True

class LabourRequirementResponse(BaseModel):
    id: int
    contractor_id: int
    project_id: int
    project_name: Optional[str] = None
    site_id: int
    site_name: Optional[str] = None
    required_start_date: date
    required_end_date: date
    work_schedule: str
    status: RequirementStatus
    items: List[LabourRequirementItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LabourRequirementUpdateRequest(BaseModel):
    work_schedule: Optional[str] = None
    required_end_date: Optional[date] = None
    status: Optional[RequirementStatus] = None

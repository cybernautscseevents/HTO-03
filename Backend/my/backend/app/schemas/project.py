from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.project import ProjectStatus

class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    start_date: date
    expected_end_date: Optional[date] = None

class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_status: Optional[ProjectStatus] = None
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None

class SiteCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    address: str = Field(..., min_length=2, max_length=255)
    region: str = Field(..., min_length=2, max_length=100)
    supervisor_id: Optional[int] = None

class SiteUpdateRequest(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    region: Optional[str] = None
    supervisor_id: Optional[int] = None
    active: Optional[bool] = None

class SiteResponse(BaseModel):
    id: int
    project_id: int
    name: str
    address: str
    region: str
    supervisor_id: Optional[int] = None
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: int
    contractor_id: int
    name: str
    description: Optional[str] = None
    project_status: ProjectStatus
    start_date: date
    expected_end_date: Optional[date] = None
    sites: List[SiteResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

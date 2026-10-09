from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.work_order import WorkOrderStatus

class WorkOrderVersionCreateRequest(BaseModel):
    wage_rate: float = Field(..., ge=0)
    wage_period: Optional[str] = "DAILY"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    working_schedule: Optional[str] = None
    terms_text: Optional[str] = None
    reason: str = Field(..., min_length=3)

class WorkOrderVersionResponse(BaseModel):
    id: int
    work_order_id: int
    version_number: int
    agreed_wage_rate: float
    wage_period: str
    start_date: date
    end_date: date
    working_schedule: str
    terms_text: Optional[str] = None
    changed_by: int
    changed_at: datetime
    reason: str
    worker_confirmed: bool
    confirmed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WorkOrderResponse(BaseModel):
    id: int
    requirement_item_id: Optional[int] = None
    contractor_id: int
    worker_id: int
    worker_name: Optional[str] = None
    project_id: int
    project_name: Optional[str] = None
    site_id: int
    site_name: Optional[str] = None
    trade_id: int
    trade_name: Optional[str] = None
    role_title: str
    current_version_id: Optional[int] = None
    status: WorkOrderStatus
    acceptance_timestamp: datetime
    versions: List[WorkOrderVersionResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

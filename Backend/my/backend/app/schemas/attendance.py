from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from app.models.attendance import AttendanceStatus, ConfirmationMethod

class CheckInRequest(BaseModel):
    assignment_id: int
    confirmation_method: ConfirmationMethod = ConfirmationMethod.APP
    notes: Optional[str] = None

class CheckOutRequest(BaseModel):
    notes: Optional[str] = None

class AttendanceConfirmRequest(BaseModel):
    status: AttendanceStatus = AttendanceStatus.PRESENT
    notes: Optional[str] = None

class AttendanceDisputeRequest(BaseModel):
    description: str

class AttendanceResponse(BaseModel):
    id: int
    assignment_id: int
    worker_id: int
    worker_name: Optional[str] = None
    date: date
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    worker_confirmed: bool
    supervisor_confirmed: bool
    confirmed_by: Optional[int] = None
    attendance_status: AttendanceStatus
    confirmation_method: ConfirmationMethod
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

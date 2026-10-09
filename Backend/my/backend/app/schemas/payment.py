from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field
from app.models.payment import PaymentStatus, PaymentMethod

class WageCalculationResponse(BaseModel):
    attendance_id: int
    worker_id: int
    worker_name: str
    date: date
    attendance_status: str
    daily_rate: float
    calculated_amount: float
    work_order_version: int
    note: str = "Wage calculated based on confirmed attendance. Does not verify payment transfer."

class PaymentRecordCreateRequest(BaseModel):
    attendance_id: Optional[int] = None
    assignment_id: Optional[int] = None
    worker_id: Optional[int] = None
    agreed_amount: Optional[float] = Field(None, ge=0)
    amount_reported_paid: float = Field(..., ge=0)
    payment_date: Optional[date] = None
    payment_method: PaymentMethod = PaymentMethod.UPI
    payment_reference: Optional[str] = None
    supporting_evidence: Optional[str] = None
    notes: Optional[str] = None

class PaymentRecordUpdateRequest(BaseModel):
    amount_reported_paid: Optional[float] = Field(None, ge=0)
    payment_status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = None
    supporting_evidence: Optional[str] = None
    notes: Optional[str] = None

class PaymentRecordResponse(BaseModel):
    id: int
    worker_id: int
    worker_name: Optional[str] = None
    assignment_id: int
    attendance_id: Optional[int] = None
    agreed_amount: float
    amount_due: float
    amount_reported_paid: float
    payment_date: Optional[date] = None
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = None
    payment_status: PaymentStatus
    supporting_evidence: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

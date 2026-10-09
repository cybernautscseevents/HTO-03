from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.worker import Worker
from app.models.contractor import Contractor
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.attendance import Attendance
from app.models.dispute import DisputeType
from app.schemas.payment import (
    WageCalculationResponse, PaymentRecordCreateRequest,
    PaymentRecordUpdateRequest, PaymentRecordResponse
)
from app.schemas.dispute import DisputeCreateRequest
from app.schemas.common import StandardResponse
from app.services.wage_payment_service import WagePaymentService
from app.services.dispute_service import DisputeService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

router = APIRouter(tags=["Wages & Payments"])

def serialize_payment(pay: PaymentRecord) -> PaymentRecordResponse:
    return PaymentRecordResponse(
        id=pay.id,
        worker_id=pay.worker_id,
        worker_name=pay.worker.user.name if (pay.worker and pay.worker.user) else None,
        assignment_id=pay.assignment_id,
        attendance_id=pay.attendance_id,
        agreed_amount=pay.agreed_amount,
        amount_due=pay.amount_due,
        amount_reported_paid=pay.amount_reported_paid,
        payment_date=pay.payment_date,
        payment_method=pay.payment_method,
        payment_reference=pay.payment_reference,
        payment_status=pay.payment_status,
        supporting_evidence=pay.supporting_evidence,
        notes=pay.notes,
        created_at=pay.created_at,
        updated_at=pay.updated_at
    )

@router.get("/attendance/{attendance_id}/wage", response_model=StandardResponse[WageCalculationResponse])
def get_daily_wage_calculation(
    attendance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not att:
        raise ResourceNotFound("Attendance record not found")

    if current_user.role == UserRole.WORKER and att.worker.user_id != current_user.id:
        raise UnauthorizedResource("Cannot view wage calculation for another worker")

    calc = WagePaymentService.calculate_wage_for_attendance(db, attendance_id)
    return StandardResponse(data=calc, message="Wage calculated successfully based on confirmed attendance")

@router.post("/payments", response_model=StandardResponse[PaymentRecordResponse], status_code=status.HTTP_201_CREATED)
def record_payment(
    req: PaymentRecordCreateRequest,
    current_user: User = Depends(require_role([UserRole.CONTRACTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    record = WagePaymentService.record_payment(
        db=db,
        actor_user=current_user,
        data=req
    )
    return StandardResponse(data=serialize_payment(record), message="Payment record created (Status: REPORTED_PAID)")

@router.get("/payments", response_model=StandardResponse[List[PaymentRecordResponse]])
def list_payment_records(
    worker_id: Optional[int] = Query(None),
    status_filter: Optional[PaymentStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(PaymentRecord)
    if current_user.role == UserRole.WORKER:
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker:
            return StandardResponse(data=[], message="No worker profile")
        query = query.filter(PaymentRecord.worker_id == worker.id)
    elif current_user.role == UserRole.CONTRACTOR:
        contractor = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
        if not contractor:
            return StandardResponse(data=[], message="No contractor profile")
        query = query.filter(PaymentRecord.assignment.has(work_order=Assignment.work_order.has(contractor_id=contractor.id)))

    if worker_id and current_user.role != UserRole.WORKER:
        query = query.filter(PaymentRecord.worker_id == worker_id)
    if status_filter:
        query = query.filter(PaymentRecord.payment_status == status_filter)

    payments = query.order_by(PaymentRecord.created_at.desc()).all()
    return StandardResponse(data=[serialize_payment(p) for p in payments], message="Payment records fetched")

@router.get("/payments/{payment_id}", response_model=StandardResponse[PaymentRecordResponse])
def get_payment_record(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pay = db.query(PaymentRecord).filter(PaymentRecord.id == payment_id).first()
    if not pay:
        raise ResourceNotFound("Payment record not found")

    if current_user.role == UserRole.WORKER and pay.worker.user_id != current_user.id:
        raise UnauthorizedResource("Cannot view payment record of another worker")

    return StandardResponse(data=serialize_payment(pay), message="Payment record fetched")

@router.patch("/payments/{payment_id}", response_model=StandardResponse[PaymentRecordResponse])
def update_payment_record(
    payment_id: int,
    req: PaymentRecordUpdateRequest,
    current_user: User = Depends(require_role([UserRole.CONTRACTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    pay = db.query(PaymentRecord).filter(PaymentRecord.id == payment_id).first()
    if not pay:
        raise ResourceNotFound("Payment record not found")

    if req.amount_reported_paid is not None:
        pay.amount_reported_paid = req.amount_reported_paid
    if req.payment_status is not None:
        pay.payment_status = req.payment_status
    if req.payment_method is not None:
        pay.payment_method = req.payment_method
    if req.payment_reference is not None:
        pay.payment_reference = req.payment_reference
    if req.supporting_evidence is not None:
        pay.supporting_evidence = req.supporting_evidence
    if req.notes is not None:
        pay.notes = req.notes

    db.commit()
    db.refresh(pay)
    return StandardResponse(data=serialize_payment(pay), message="Payment record updated")

@router.post("/payments/{payment_id}/dispute", response_model=StandardResponse[dict])
def dispute_payment(
    payment_id: int,
    description: str = Query(..., min_length=5, description="Reason for disputing payment"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pay = db.query(PaymentRecord).filter(PaymentRecord.id == payment_id).first()
    if not pay:
        raise ResourceNotFound("Payment record not found")

    dispute_req = DisputeCreateRequest(
        dispute_type=DisputeType.PAYMENT,
        payment_id=pay.id,
        assignment_id=pay.assignment_id,
        worker_id=pay.worker_id,
        contractor_id=pay.assignment.work_order.contractor_id,
        description=description
    )
    dispute = DisputeService.create_dispute(db, current_user, dispute_req)
    return StandardResponse(data={"payment_id": pay.id, "dispute_id": dispute.id, "status": "DISPUTED"}, message="Payment dispute created successfully")

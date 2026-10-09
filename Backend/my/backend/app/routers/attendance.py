from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.worker import Worker
from app.models.contractor import Contractor
from app.models.attendance import Attendance, AttendanceStatus, ConfirmationMethod
from app.models.dispute import DisputeType
from app.schemas.attendance import (
    CheckInRequest, CheckOutRequest, AttendanceConfirmRequest,
    AttendanceDisputeRequest, AttendanceResponse
)
from app.schemas.dispute import DisputeCreateRequest
from app.schemas.common import StandardResponse
from app.services.attendance_service import AttendanceService
from app.services.dispute_service import DisputeService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

router = APIRouter(prefix="/attendance", tags=["Attendance"])

def serialize_attendance(att: Attendance) -> AttendanceResponse:
    return AttendanceResponse(
        id=att.id,
        assignment_id=att.assignment_id,
        worker_id=att.worker_id,
        worker_name=att.worker.user.name if (att.worker and att.worker.user) else None,
        date=att.date,
        check_in_time=att.check_in_time,
        check_out_time=att.check_out_time,
        worker_confirmed=att.worker_confirmed,
        supervisor_confirmed=att.supervisor_confirmed,
        confirmed_by=att.confirmed_by,
        attendance_status=att.attendance_status,
        confirmation_method=att.confirmation_method,
        notes=att.notes,
        created_at=att.created_at,
        updated_at=att.updated_at
    )

@router.post("/check-in", response_model=StandardResponse[AttendanceResponse], status_code=status.HTTP_201_CREATED)
def worker_check_in(
    req: CheckInRequest,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    att = AttendanceService.check_in(
        db=db,
        assignment_id=req.assignment_id,
        worker_user=current_user,
        confirmation_method=req.confirmation_method,
        notes=req.notes
    )
    return StandardResponse(data=serialize_attendance(att), message="Check-in registered successfully (No GPS required)")

@router.post("/{attendance_id}/check-out", response_model=StandardResponse[AttendanceResponse])
def worker_check_out(
    attendance_id: int,
    req: CheckOutRequest,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    att = AttendanceService.check_out(
        db=db,
        attendance_id=attendance_id,
        worker_user=current_user,
        notes=req.notes
    )
    return StandardResponse(data=serialize_attendance(att), message="Check-out registered successfully")

@router.post("/{attendance_id}/confirm", response_model=StandardResponse[AttendanceResponse])
def confirm_attendance(
    attendance_id: int,
    req: AttendanceConfirmRequest,
    current_user: User = Depends(require_role([UserRole.SUPERVISOR, UserRole.CONTRACTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    att = AttendanceService.confirm_attendance(
        db=db,
        attendance_id=attendance_id,
        confirmer_user=current_user,
        status=req.status,
        notes=req.notes
    )
    return StandardResponse(data=serialize_attendance(att), message=f"Attendance confirmed as {att.attendance_status.value}")

@router.post("/{attendance_id}/dispute", response_model=StandardResponse[dict])
def dispute_attendance(
    attendance_id: int,
    req: AttendanceDisputeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not att:
        raise ResourceNotFound("Attendance record not found")

    dispute_req = DisputeCreateRequest(
        dispute_type=DisputeType.ATTENDANCE,
        attendance_id=att.id,
        assignment_id=att.assignment_id,
        worker_id=att.worker_id,
        contractor_id=att.assignment.work_order.contractor_id,
        description=req.description
    )
    dispute = DisputeService.create_dispute(db, current_user, dispute_req)
    att.attendance_status = AttendanceStatus.DISPUTED
    db.commit()

    return StandardResponse(
        data={"attendance_id": att.id, "dispute_id": dispute.id, "status": "DISPUTED"},
        message="Attendance dispute filed successfully"
    )

@router.get("", response_model=StandardResponse[List[AttendanceResponse]])
def list_attendance(
    worker_id: Optional[int] = Query(None),
    assignment_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    date_val: Optional[date] = Query(None, alias="date"),
    status_filter: Optional[AttendanceStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Attendance)

    # Permission filter
    if current_user.role == UserRole.WORKER:
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker:
            return StandardResponse(data=[], message="No worker profile")
        query = query.filter(Attendance.worker_id == worker.id)
    elif current_user.role == UserRole.CONTRACTOR:
        contractor = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
        if not contractor:
            return StandardResponse(data=[], message="No contractor profile")
        query = query.filter(Attendance.assignment.has(work_order=Assignment.work_order.has(contractor_id=contractor.id)))

    if worker_id and current_user.role != UserRole.WORKER:
        query = query.filter(Attendance.worker_id == worker_id)
    if assignment_id:
        query = query.filter(Attendance.assignment_id == assignment_id)
    if date_val:
        query = query.filter(Attendance.date == date_val)
    if status_filter:
        query = query.filter(Attendance.attendance_status == status_filter)

    records = query.order_by(Attendance.date.desc(), Attendance.id.desc()).all()
    return StandardResponse(data=[serialize_attendance(a) for a in records], message="Attendance records fetched")

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.worker import Worker
from app.models.contractor import Contractor
from app.models.assignment import Assignment, AssignmentStatus
from app.schemas.assignment import AssignmentResponse, ReplacementRequest, ReplacementResponse
from app.schemas.common import StandardResponse
from app.services.assignment_service import AssignmentService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

router = APIRouter(prefix="/assignments", tags=["Assignments"])

def serialize_assignment(asgn: Assignment) -> AssignmentResponse:
    return AssignmentResponse(
        id=asgn.id,
        work_order_id=asgn.work_order_id,
        worker_id=asgn.worker_id,
        worker_name=asgn.worker.user.name if (asgn.worker and asgn.worker.user) else None,
        project_id=asgn.project_id,
        project_name=asgn.project.name if asgn.project else None,
        site_id=asgn.site_id,
        site_name=asgn.site.name if asgn.site else None,
        start_date=asgn.start_date,
        end_date=asgn.end_date,
        status=asgn.status,
        replacement_reason=asgn.replacement_reason,
        replaced_by_assignment_id=asgn.replaced_by_assignment_id,
        created_at=asgn.created_at,
        updated_at=asgn.updated_at
    )

@router.get("", response_model=StandardResponse[List[AssignmentResponse]])
def list_assignments(
    project_id: Optional[int] = Query(None),
    status_filter: Optional[AssignmentStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Assignment)
    if current_user.role == UserRole.WORKER:
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker:
            return StandardResponse(data=[], message="No worker profile")
        query = query.filter(Assignment.worker_id == worker.id)
    elif current_user.role == UserRole.CONTRACTOR:
        contractor = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
        if not contractor:
            return StandardResponse(data=[], message="No contractor profile")
        query = query.filter(Assignment.work_order.has(contractor_id=contractor.id))

    if project_id:
        query = query.filter(Assignment.project_id == project_id)
    if status_filter:
        query = query.filter(Assignment.status == status_filter)

    asgns = query.order_by(Assignment.created_at.desc()).all()
    return StandardResponse(data=[serialize_assignment(a) for a in asgns], message="Assignments fetched")

@router.get("/{assignment_id}", response_model=StandardResponse[AssignmentResponse])
def get_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asgn = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not asgn:
        raise ResourceNotFound("Assignment not found")

    if current_user.role == UserRole.WORKER and asgn.worker.user_id != current_user.id:
        raise UnauthorizedResource("Cannot view another worker's assignment")
    if current_user.role == UserRole.CONTRACTOR and asgn.work_order.contractor.user_id != current_user.id:
        raise UnauthorizedResource("Cannot view another contractor's assignment")

    return StandardResponse(data=serialize_assignment(asgn), message="Assignment fetched")

@router.post("/{assignment_id}/cancel", response_model=StandardResponse[AssignmentResponse])
def cancel_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    reason: str = Query("Assignment cancelled", description="Reason for cancellation"),
    db: Session = Depends(get_db)
):
    asgn = AssignmentService.cancel_assignment(db, assignment_id, current_user, reason)
    return StandardResponse(data=serialize_assignment(asgn), message="Assignment cancelled")

@router.post("/{assignment_id}/replacement-request", response_model=StandardResponse[ReplacementResponse])
def request_worker_replacement(
    assignment_id: int,
    req: ReplacementRequest,
    current_user: User = Depends(require_role([UserRole.CONTRACTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    result = AssignmentService.request_replacement(
        db=db,
        assignment_id=assignment_id,
        contractor_user=current_user,
        reason=req.reason
    )
    return StandardResponse(
        data=ReplacementResponse(
            original_assignment_id=result["original_assignment_id"],
            status=result["status"],
            reason=result["reason"],
            suitable_replacements=result["suitable_replacements"]
        ),
        message="Replacement request processed. Original assignment retained in history. Matching candidates returned."
    )

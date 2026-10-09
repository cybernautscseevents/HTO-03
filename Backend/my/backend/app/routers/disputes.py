from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.worker import Worker
from app.models.contractor import Contractor
from app.models.dispute import Dispute, DisputeResponse
from app.schemas.dispute import (
    DisputeCreateRequest, DisputeResponseRequest, DisputeResolveRequest,
    DisputeDetailResponse, DisputeResponseSchema
)
from app.schemas.common import StandardResponse
from app.services.dispute_service import DisputeService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

router = APIRouter(prefix="/disputes", tags=["Disputes"])

def serialize_dispute(d: Dispute) -> DisputeDetailResponse:
    responses = []
    for r in d.responses:
        responses.append(DisputeResponseSchema(
            id=r.id,
            dispute_id=r.dispute_id,
            responder_id=r.responder_id,
            responder_name=r.responder.name if r.responder else None,
            message=r.message,
            evidence_reference=r.evidence_reference,
            created_at=r.created_at
        ))

    return DisputeDetailResponse(
        id=d.id,
        raised_by=d.raised_by,
        raised_by_name=d.initiator.name if d.initiator else None,
        worker_id=d.worker_id,
        worker_name=d.worker.user.name if (d.worker and d.worker.user) else None,
        contractor_id=d.contractor_id,
        contractor_name=d.contractor.company_name if d.contractor else None,
        assignment_id=d.assignment_id,
        attendance_id=d.attendance_id,
        payment_id=d.payment_id,
        dispute_type=d.dispute_type,
        description=d.description,
        status=d.status,
        resolution=d.resolution,
        resolved_by=d.resolved_by,
        resolved_at=d.resolved_at,
        responses=responses,
        created_at=d.created_at,
        updated_at=d.updated_at
    )

@router.post("", response_model=StandardResponse[DisputeDetailResponse], status_code=status.HTTP_201_CREATED)
def raise_dispute(
    req: DisputeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dispute = DisputeService.create_dispute(db, current_user, req)
    return StandardResponse(data=serialize_dispute(dispute), message="Dispute opened successfully")

@router.get("", response_model=StandardResponse[List[DisputeDetailResponse]])
def list_disputes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Dispute)
    if current_user.role == UserRole.WORKER:
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker:
            return StandardResponse(data=[], message="No worker profile")
        query = query.filter(Dispute.worker_id == worker.id)
    elif current_user.role == UserRole.CONTRACTOR:
        contractor = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
        if not contractor:
            return StandardResponse(data=[], message="No contractor profile")
        query = query.filter(Dispute.contractor_id == contractor.id)

    disputes = query.order_by(Dispute.created_at.desc()).all()
    return StandardResponse(data=[serialize_dispute(d) for d in disputes], message="Disputes fetched")

@router.get("/{dispute_id}", response_model=StandardResponse[DisputeDetailResponse])
def get_dispute(
    dispute_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise ResourceNotFound("Dispute not found")

    if current_user.role == UserRole.WORKER and dispute.worker.user_id != current_user.id:
        raise UnauthorizedResource("Cannot view dispute belonging to another worker")
    if current_user.role == UserRole.CONTRACTOR and dispute.contractor.user_id != current_user.id:
        raise UnauthorizedResource("Cannot view dispute belonging to another contractor")

    return StandardResponse(data=serialize_dispute(dispute), message="Dispute fetched")

@router.post("/{dispute_id}/respond", response_model=StandardResponse[DisputeResponseSchema])
def respond_to_dispute(
    dispute_id: int,
    req: DisputeResponseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resp = DisputeService.add_response(db, dispute_id, current_user, req)
    return StandardResponse(data=DisputeResponseSchema.model_validate(resp), message="Response added to dispute record")

@router.post("/{dispute_id}/resolve", response_model=StandardResponse[DisputeDetailResponse])
def resolve_dispute(
    dispute_id: int,
    req: DisputeResolveRequest,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONTRACTOR])),
    db: Session = Depends(get_db)
):
    resolved = DisputeService.resolve_dispute(db, dispute_id, current_user, req)
    return StandardResponse(data=serialize_dispute(resolved), message="Dispute resolved successfully without altering historical evidence")

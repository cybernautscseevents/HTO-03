from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role, get_current_worker, get_current_contractor
from app.models.user import User, UserRole
from app.models.worker import Worker
from app.models.contractor import Contractor
from app.models.offer import JobOffer, OfferStatus
from app.schemas.offer import JobOfferCreateRequest, JobOfferResponse, WorkerContactResponse
from app.schemas.common import StandardResponse
from app.services.offer_service import OfferService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

router = APIRouter(prefix="/offers", tags=["Job Offers"])

def serialize_offer(offer: JobOffer) -> JobOfferResponse:
    item = offer.requirement_item
    return JobOfferResponse(
        id=offer.id,
        requirement_item_id=offer.requirement_item_id,
        worker_id=offer.worker_id,
        worker_name=offer.worker.user.name if (offer.worker and offer.worker.user) else None,
        trade_name=item.trade.name if (item and item.trade) else None,
        skill_name=item.skill.name if (item and item.skill) else None,
        offered_wage=offer.offered_wage,
        status=offer.status,
        expires_at=offer.expires_at,
        created_at=offer.created_at,
        responded_at=offer.responded_at
    )

@router.post("", response_model=StandardResponse[JobOfferResponse], status_code=status.HTTP_201_CREATED)
def create_job_offer(
    req: JobOfferCreateRequest,
    current_user: User = Depends(require_role([UserRole.CONTRACTOR])),
    db: Session = Depends(get_db)
):
    offer = OfferService.create_offer(
        db=db,
        requirement_item_id=req.requirement_item_id,
        worker_id=req.worker_id,
        contractor_user=current_user,
        expires_in_hours=req.expires_in_hours
    )
    return StandardResponse(data=serialize_offer(offer), message="Job offer sent to worker successfully")

@router.get("", response_model=StandardResponse[List[JobOfferResponse]])
def list_offers(
    status_filter: Optional[OfferStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(JobOffer)
    if current_user.role == UserRole.WORKER:
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker:
            return StandardResponse(data=[], message="No worker profile")
        query = query.filter(JobOffer.worker_id == worker.id)
    elif current_user.role == UserRole.CONTRACTOR:
        contractor = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
        if not contractor:
            return StandardResponse(data=[], message="No contractor profile")
        query = query.filter(JobOffer.requirement_item.has(requirement=LabourRequirement.contractor_id == contractor.id))

    if status_filter:
        query = query.filter(JobOffer.status == status_filter)

    offers = query.order_by(JobOffer.created_at.desc()).all()
    return StandardResponse(data=[serialize_offer(o) for o in offers], message="Job offers fetched")

@router.get("/{offer_id}", response_model=StandardResponse[JobOfferResponse])
def get_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
    if not offer:
        raise ResourceNotFound("Offer not found")

    # Verification: worker or contractor
    if current_user.role == UserRole.WORKER and offer.worker.user_id != current_user.id:
        raise UnauthorizedResource("Cannot view offer sent to another worker")
    if current_user.role == UserRole.CONTRACTOR and offer.requirement_item.requirement.contractor.user_id != current_user.id:
        raise UnauthorizedResource("Cannot view offer from another contractor")

    return StandardResponse(data=serialize_offer(offer), message="Job offer details fetched")

@router.post("/{offer_id}/accept", response_model=StandardResponse[dict])
def accept_job_offer(
    offer_id: int,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    result = OfferService.accept_offer(
        db=db,
        offer_id=offer_id,
        worker_user_id=current_user.id,
        is_automated_system=False
    )
    return StandardResponse(data=result, message="Job offer accepted. Work order and assignment created.")

@router.post("/{offer_id}/reject", response_model=StandardResponse[JobOfferResponse])
def reject_job_offer(
    offer_id: int,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    offer = OfferService.reject_offer(
        db=db,
        offer_id=offer_id,
        worker_user_id=current_user.id,
        is_automated_system=False
    )
    return StandardResponse(data=serialize_offer(offer), message="Job offer rejected. Worker contact withheld.")

@router.post("/{offer_id}/cancel", response_model=StandardResponse[JobOfferResponse])
def cancel_job_offer(
    offer_id: int,
    current_user: User = Depends(require_role([UserRole.CONTRACTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    offer = OfferService.cancel_offer(
        db=db,
        offer_id=offer_id,
        actor_user=current_user
    )
    return StandardResponse(data=serialize_offer(offer), message="Job offer cancelled successfully")

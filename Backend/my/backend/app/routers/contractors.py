from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role, get_current_contractor
from app.models.user import User, UserRole
from app.models.contractor import Contractor
from app.models.assignment import Assignment, AssignmentStatus
from app.models.worker import Worker
from app.schemas.contractor import ContractorCreateRequest, ContractorUpdateRequest, ContractorResponse
from app.schemas.worker import WorkerResponse
from app.schemas.performance import ContractorPerformanceResponse
from app.schemas.common import StandardResponse
from app.services.performance_service import PerformanceService
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound

router = APIRouter(prefix="/contractors", tags=["Contractors"])

@router.post("", response_model=StandardResponse[ContractorResponse], status_code=status.HTTP_201_CREATED)
def create_contractor_profile(req: ContractorCreateRequest, current_user: User = Depends(require_role([UserRole.CONTRACTOR])), db: Session = Depends(get_db)):
    existing = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Contractor profile already exists")

    contractor = Contractor(
        user_id=current_user.id,
        company_name=req.company_name,
        contact_person=req.contact_person,
        verification_status="VERIFIED"
    )
    db.add(contractor)
    db.commit()
    db.refresh(contractor)

    return StandardResponse(data=ContractorResponse.model_validate(contractor), message="Contractor profile created successfully")

@router.get("/me", response_model=StandardResponse[ContractorResponse])
def get_my_contractor_profile(contractor: Contractor = Depends(get_current_contractor)):
    return StandardResponse(data=ContractorResponse.model_validate(contractor), message="Contractor profile fetched")

@router.patch("/me", response_model=StandardResponse[ContractorResponse])
def update_my_contractor_profile(req: ContractorUpdateRequest, contractor: Contractor = Depends(get_current_contractor), db: Session = Depends(get_db)):
    if req.company_name:
        contractor.company_name = req.company_name
    if req.contact_person:
        contractor.contact_person = req.contact_person
    db.commit()
    db.refresh(contractor)
    return StandardResponse(data=ContractorResponse.model_validate(contractor), message="Contractor profile updated")

@router.get("/me/workers", response_model=StandardResponse[List[dict]])
def get_contractor_workforce(contractor: Contractor = Depends(get_current_contractor), db: Session = Depends(get_db)):
    """
    Returns workers currently associated with this contractor's assignments.
    Does not expose unrelated workers.
    """
    assignments = db.query(Assignment).filter(
        Assignment.work_order.has(contractor_id=contractor.id),
        Assignment.status.in_([AssignmentStatus.ACTIVE, AssignmentStatus.ASSIGNED])
    ).all()

    worker_list = []
    seen = set()
    for asgn in assignments:
        w = asgn.worker
        if w.id in seen:
            continue
        seen.add(w.id)
        worker_list.append({
            "worker_id": w.id,
            "name": w.user.name,
            "phone_number": w.user.phone_number,  # Revealed because assigned to this contractor
            "availability": w.availability_status.value,
            "assignment_id": asgn.id,
            "project_name": asgn.project.name,
            "site_name": asgn.site.name,
            "role": asgn.work_order.role_title
        })

    return StandardResponse(data=worker_list, message="Associated workforce fetched successfully")

@router.get("/me/performance", response_model=StandardResponse[ContractorPerformanceResponse])
def get_contractor_performance_indicators(contractor: Contractor = Depends(get_current_contractor), db: Session = Depends(get_db)):
    perf = PerformanceService.get_contractor_performance(db, contractor.id)
    return StandardResponse(data=perf, message="Contractor performance indicators fetched")

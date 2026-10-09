from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.worker import Worker, WorkerAvailability, WorkerVerificationStatus
from app.models.trade_skill import WorkerSkill, Skill, VerificationStatus
from app.models.contractor import Contractor
from app.models.offer import WorkerContactRelease
from app.schemas.worker import (
    WorkerCreateRequest, WorkerUpdateRequest, WorkerAvailabilityUpdateRequest,
    WorkerResponse, WorkerPublicResponse
)
from app.schemas.trade_skill import (
    WorkerSkillCreateRequest, WorkerSkillUpdateRequest, WorkerSkillVerifyRequest, WorkerSkillResponse
)
from app.schemas.performance import WorkerPerformanceResponse
from app.schemas.common import StandardResponse
from app.services.performance_service import PerformanceService
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

router = APIRouter(prefix="/workers", tags=["Workers"])

def serialize_worker_skills(db: Session, worker_id: int) -> List[WorkerSkillResponse]:
    ws_list = db.query(WorkerSkill).filter(WorkerSkill.worker_id == worker_id).all()
    results = []
    for ws in ws_list:
        sk = db.query(Skill).filter(Skill.id == ws.skill_id).first()
        results.append(WorkerSkillResponse(
            id=ws.id,
            worker_id=ws.worker_id,
            skill_id=ws.skill_id,
            skill_name=sk.name if sk else None,
            trade_name=sk.trade.name if (sk and sk.trade) else None,
            skill_level=ws.skill_level,
            verification_status=ws.verification_status,
            verified_by=ws.verified_by,
            verified_at=ws.verified_at,
            evidence_reference=ws.evidence_reference,
            created_at=ws.created_at
        ))
    return results

@router.post("", response_model=StandardResponse[WorkerResponse], status_code=status.HTTP_201_CREATED)
def create_worker_profile(req: WorkerCreateRequest, current_user: User = Depends(require_role([UserRole.WORKER])), db: Session = Depends(get_db)):
    existing = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Worker profile already exists")

    worker = Worker(
        user_id=current_user.id,
        preferred_language=req.preferred_language,
        home_region=req.home_region,
        current_work_region=req.current_work_region,
        expected_daily_wage=req.expected_daily_wage,
        availability_status=WorkerAvailability.AVAILABLE,
        verification_status=WorkerVerificationStatus.BASIC_VERIFIED
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)

    skills = serialize_worker_skills(db, worker.id)
    resp = WorkerResponse(
        id=worker.id,
        user_id=worker.user_id,
        name=current_user.name,
        phone_number=current_user.phone_number,
        preferred_language=worker.preferred_language,
        home_region=worker.home_region,
        current_work_region=worker.current_work_region,
        expected_daily_wage=worker.expected_daily_wage,
        availability_status=worker.availability_status,
        profile_status=worker.profile_status,
        verification_status=worker.verification_status,
        skills=skills,
        created_at=worker.created_at,
        updated_at=worker.updated_at
    )
    return StandardResponse(data=resp, message="Worker profile created successfully")

@router.get("/me", response_model=StandardResponse[WorkerResponse])
def get_my_worker_profile(current_user: User = Depends(require_role([UserRole.WORKER])), db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise ResourceNotFound("Worker profile not found")

    skills = serialize_worker_skills(db, worker.id)
    resp = WorkerResponse(
        id=worker.id,
        user_id=worker.user_id,
        name=current_user.name,
        phone_number=current_user.phone_number,
        preferred_language=worker.preferred_language,
        home_region=worker.home_region,
        current_work_region=worker.current_work_region,
        expected_daily_wage=worker.expected_daily_wage,
        availability_status=worker.availability_status,
        profile_status=worker.profile_status,
        verification_status=worker.verification_status,
        skills=skills,
        created_at=worker.created_at,
        updated_at=worker.updated_at
    )
    return StandardResponse(data=resp, message="Worker profile fetched successfully")

@router.patch("/me", response_model=StandardResponse[WorkerResponse])
def update_my_worker_profile(req: WorkerUpdateRequest, current_user: User = Depends(require_role([UserRole.WORKER])), db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise ResourceNotFound("Worker profile not found")

    if req.preferred_language:
        worker.preferred_language = req.preferred_language
    if req.home_region:
        worker.home_region = req.home_region
    if req.current_work_region:
        worker.current_work_region = req.current_work_region
    if req.expected_daily_wage is not None:
        worker.expected_daily_wage = req.expected_daily_wage
    if req.profile_status:
        worker.profile_status = req.profile_status

    db.commit()
    db.refresh(worker)

    skills = serialize_worker_skills(db, worker.id)
    resp = WorkerResponse(
        id=worker.id,
        user_id=worker.user_id,
        name=current_user.name,
        phone_number=current_user.phone_number,
        preferred_language=worker.preferred_language,
        home_region=worker.home_region,
        current_work_region=worker.current_work_region,
        expected_daily_wage=worker.expected_daily_wage,
        availability_status=worker.availability_status,
        profile_status=worker.profile_status,
        verification_status=worker.verification_status,
        skills=skills,
        created_at=worker.created_at,
        updated_at=worker.updated_at
    )
    return StandardResponse(data=resp, message="Worker profile updated successfully")

@router.patch("/me/availability", response_model=StandardResponse[dict])
def update_worker_availability(req: WorkerAvailabilityUpdateRequest, current_user: User = Depends(require_role([UserRole.WORKER])), db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise ResourceNotFound("Worker profile not found")

    old_status = worker.availability_status
    worker.availability_status = req.status

    AuditService.log(
        db=db,
        actor_id=current_user.id,
        entity_type="WORKER_AVAILABILITY",
        entity_id=worker.id,
        action="AVAILABILITY_CHANGED",
        old_value={"status": old_status.value},
        new_value={"status": req.status.value},
        reason="Worker updated own availability status"
    )
    db.commit()

    return StandardResponse(
        data={"worker_id": worker.id, "availability_status": worker.availability_status.value},
        message="Availability status updated successfully"
    )

@router.get("/me/skills", response_model=StandardResponse[List[WorkerSkillResponse]])
def get_my_worker_skills(current_user: User = Depends(require_role([UserRole.WORKER])), db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise ResourceNotFound("Worker profile not found")
    skills = serialize_worker_skills(db, worker.id)
    return StandardResponse(data=skills, message="Worker skills fetched successfully")

@router.post("/me/skills", response_model=StandardResponse[WorkerSkillResponse], status_code=status.HTTP_201_CREATED)
def add_my_worker_skill(req: WorkerSkillCreateRequest, current_user: User = Depends(require_role([UserRole.WORKER])), db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise ResourceNotFound("Worker profile not found")

    skill = db.query(Skill).filter(Skill.id == req.skill_id).first()
    if not skill:
        raise ResourceNotFound("Skill not found")

    # Constraint: Cannot declare CERTIFIED without actual evidence
    status_to_assign = req.verification_status
    if status_to_assign == VerificationStatus.CERTIFIED and not req.evidence_reference:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "CERTIFICATION_EVIDENCE_REQUIRED", "message": "Actual certificate evidence reference is mandatory for CERTIFIED status"}
        )

    existing = db.query(WorkerSkill).filter(
        WorkerSkill.worker_id == worker.id,
        WorkerSkill.skill_id == req.skill_id
    ).first()

    if existing:
        existing.skill_level = req.skill_level
        existing.verification_status = status_to_assign
        existing.evidence_reference = req.evidence_reference
        db.commit()
        db.refresh(existing)
        ws = existing
    else:
        ws = WorkerSkill(
            worker_id=worker.id,
            skill_id=req.skill_id,
            skill_level=req.skill_level,
            verification_status=status_to_assign,
            evidence_reference=req.evidence_reference
        )
        db.add(ws)
        db.commit()
        db.refresh(ws)

    return StandardResponse(
        data=WorkerSkillResponse(
            id=ws.id,
            worker_id=ws.worker_id,
            skill_id=ws.skill_id,
            skill_name=skill.name,
            trade_name=skill.trade.name if skill.trade else None,
            skill_level=ws.skill_level,
            verification_status=ws.verification_status,
            evidence_reference=ws.evidence_reference,
            created_at=ws.created_at
        ),
        message="Worker skill recorded successfully"
    )

@router.patch("/me/skills/{worker_skill_id}", response_model=StandardResponse[WorkerSkillResponse])
def update_my_worker_skill(worker_skill_id: int, req: WorkerSkillUpdateRequest, current_user: User = Depends(require_role([UserRole.WORKER])), db: Session = Depends(get_db)):
    ws = db.query(WorkerSkill).filter(WorkerSkill.id == worker_skill_id).first()
    if not ws:
        raise ResourceNotFound("Worker skill not found")
    if ws.worker.user_id != current_user.id:
        raise UnauthorizedResource("Cannot edit another worker's skill")

    if req.skill_level is not None:
        ws.skill_level = req.skill_level
    if req.evidence_reference is not None:
        ws.evidence_reference = req.evidence_reference

    db.commit()
    db.refresh(ws)
    sk = ws.skill
    return StandardResponse(
        data=WorkerSkillResponse(
            id=ws.id,
            worker_id=ws.worker_id,
            skill_id=ws.skill_id,
            skill_name=sk.name if sk else None,
            trade_name=sk.trade.name if (sk and sk.trade) else None,
            skill_level=ws.skill_level,
            verification_status=ws.verification_status,
            evidence_reference=ws.evidence_reference,
            created_at=ws.created_at
        ),
        message="Worker skill updated successfully"
    )

@router.get("/me/performance", response_model=StandardResponse[WorkerPerformanceResponse])
def get_my_performance(current_user: User = Depends(require_role([UserRole.WORKER])), db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise ResourceNotFound("Worker profile not found")
    perf = PerformanceService.get_worker_performance(db, worker.id)
    return StandardResponse(data=perf, message="Performance metrics fetched successfully")

@router.get("/{worker_id}")
def get_worker_profile_by_id(worker_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns worker profile with contact privacy protection:
    If caller is contractor, phone number is masked UNLESS worker has accepted an offer from contractor.
    """
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise ResourceNotFound("Worker not found")

    skills = serialize_worker_skills(db, worker.id)
    is_self = (worker.user_id == current_user.id)
    is_admin = (current_user.role == UserRole.ADMIN)

    contact_released = False
    if current_user.role == UserRole.CONTRACTOR:
        contractor = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
        if contractor:
            release = db.query(WorkerContactRelease).filter(
                WorkerContactRelease.worker_id == worker.id,
                WorkerContactRelease.contractor_id == contractor.id
            ).first()
            if release:
                contact_released = True

    if is_self or is_admin or contact_released:
        resp = WorkerResponse(
            id=worker.id,
            user_id=worker.user_id,
            name=worker.user.name,
            phone_number=worker.user.phone_number,
            preferred_language=worker.preferred_language,
            home_region=worker.home_region,
            current_work_region=worker.current_work_region,
            expected_daily_wage=worker.expected_daily_wage,
            availability_status=worker.availability_status,
            profile_status=worker.profile_status,
            verification_status=worker.verification_status,
            skills=skills,
            created_at=worker.created_at,
            updated_at=worker.updated_at
        )
        return StandardResponse(data=resp, message="Worker profile fetched (contact revealed)")
    else:
        # Worker privacy protection: phone masked!
        resp = WorkerPublicResponse(
            id=worker.id,
            user_id=worker.user_id,
            name=worker.user.name,
            phone_number_masked="******",
            preferred_language=worker.preferred_language,
            current_work_region=worker.current_work_region,
            availability_status=worker.availability_status,
            verification_status=worker.verification_status,
            skills=skills,
            created_at=worker.created_at
        )
        return StandardResponse(data=resp, message="Worker profile fetched (contact masked for privacy)")

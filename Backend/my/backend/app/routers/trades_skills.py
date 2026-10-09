from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.trade_skill import Trade, Skill, WorkerSkill, VerificationStatus
from app.schemas.trade_skill import (
    TradeCreateRequest, TradeResponse, SkillCreateRequest, SkillResponse,
    WorkerSkillVerifyRequest, WorkerSkillResponse
)
from app.schemas.common import StandardResponse
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

router = APIRouter(tags=["Trades & Skills"])

@router.get("/trades", response_model=StandardResponse[List[TradeResponse]])
def list_trades(db: Session = Depends(get_db)):
    trades = db.query(Trade).order_by(Trade.name).all()
    return StandardResponse(data=[TradeResponse.model_validate(t) for t in trades], message="Trades fetched successfully")

@router.post("/trades", response_model=StandardResponse[TradeResponse], status_code=status.HTTP_201_CREATED)
def create_trade(req: TradeCreateRequest, current_user: User = Depends(require_role([UserRole.ADMIN])), db: Session = Depends(get_db)):
    existing = db.query(Trade).filter(Trade.name.ilike(req.name)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Trade already exists")
    trade = Trade(name=req.name.upper(), description=req.description)
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return StandardResponse(data=TradeResponse.model_validate(trade), message="Trade created successfully")

@router.get("/trades/{trade_id}/skills", response_model=StandardResponse[List[SkillResponse]])
def list_skills_by_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise ResourceNotFound("Trade not found")
    skills = db.query(Skill).filter(Skill.trade_id == trade_id).order_by(Skill.name).all()
    return StandardResponse(data=[SkillResponse.model_validate(s) for s in skills], message=f"Skills for trade {trade.name} fetched")

@router.get("/skills", response_model=StandardResponse[List[SkillResponse]])
def list_skills(trade_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Skill)
    if trade_id:
        query = query.filter(Skill.trade_id == trade_id)
    skills = query.order_by(Skill.name).all()
    return StandardResponse(data=[SkillResponse.model_validate(s) for s in skills], message="Skills fetched successfully")

@router.get("/skills/{skill_id}", response_model=StandardResponse[SkillResponse])
def get_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise ResourceNotFound("Skill not found")
    return StandardResponse(data=SkillResponse.model_validate(skill), message="Skill fetched successfully")

@router.post("/skills", response_model=StandardResponse[SkillResponse], status_code=status.HTTP_201_CREATED)
def create_skill(req: SkillCreateRequest, current_user: User = Depends(require_role([UserRole.ADMIN])), db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == req.trade_id).first()
    if not trade:
        raise ResourceNotFound("Trade not found")

    existing = db.query(Skill).filter(Skill.trade_id == req.trade_id, Skill.name.ilike(req.name)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Skill already exists for this trade")

    skill = Skill(trade_id=req.trade_id, name=req.name, description=req.description)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return StandardResponse(data=SkillResponse.model_validate(skill), message="Skill created successfully")

@router.post("/worker-skills/{worker_skill_id}/verify", response_model=StandardResponse[WorkerSkillResponse])
def verify_worker_skill(
    worker_skill_id: int,
    req: WorkerSkillVerifyRequest,
    current_user: User = Depends(require_role([UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.CONTRACTOR])),
    db: Session = Depends(get_db)
):
    ws = db.query(WorkerSkill).filter(WorkerSkill.id == worker_skill_id).first()
    if not ws:
        raise ResourceNotFound("Worker skill record not found")

    # Important Business Rule: Do NOT call worker CERTIFIED unless actual certification evidence exists
    if req.verification_status == VerificationStatus.CERTIFIED and not (req.evidence_reference or ws.evidence_reference):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "CERTIFICATION_RECORD_MISSING", "message": "Cannot mark CERTIFIED without documented certification evidence reference"}
        )

    now = datetime.now(timezone.utc)
    ws.verification_status = req.verification_status
    ws.verified_by = current_user.id
    ws.verified_at = now
    if req.evidence_reference:
        ws.evidence_reference = req.evidence_reference

    AuditService.log(
        db=db,
        actor_id=current_user.id,
        entity_type="WORKER_SKILL",
        entity_id=ws.id,
        action="SKILL_VERIFIED",
        new_value={"status": req.verification_status.value, "verified_by": current_user.id},
        reason="Supervisor/Contractor verified worker skill level"
    )

    db.commit()
    db.refresh(ws)

    return StandardResponse(
        data=WorkerSkillResponse(
            id=ws.id,
            worker_id=ws.worker_id,
            skill_id=ws.skill_id,
            skill_name=ws.skill.name if ws.skill else None,
            trade_name=ws.skill.trade.name if (ws.skill and ws.skill.trade) else None,
            skill_level=ws.skill_level,
            verification_status=ws.verification_status,
            verified_by=ws.verified_by,
            verified_at=ws.verified_at,
            evidence_reference=ws.evidence_reference,
            created_at=ws.created_at
        ),
        message="Worker skill verified successfully"
    )

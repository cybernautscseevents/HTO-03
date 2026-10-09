from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role, get_current_contractor
from app.models.user import User, UserRole
from app.models.contractor import Contractor
from app.models.project import Project, Site
from app.models.trade_skill import Trade, Skill
from app.models.requirement import LabourRequirement, LabourRequirementItem, RequirementStatus, ItemStatus
from app.schemas.requirement import (
    LabourRequirementCreateRequest, LabourRequirementResponse, LabourRequirementItemResponse,
    LabourRequirementUpdateRequest
)
from app.schemas.common import StandardResponse
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource, InvalidSkillForTrade

router = APIRouter(prefix="/labour-requirements", tags=["Labour Requirements"])

def serialize_requirement(req: LabourRequirement) -> LabourRequirementResponse:
    items = []
    for it in req.items:
        items.append(LabourRequirementItemResponse(
            id=it.id,
            requirement_id=it.requirement_id,
            trade_id=it.trade_id,
            trade_name=it.trade.name if it.trade else None,
            skill_id=it.skill_id,
            skill_name=it.skill.name if it.skill else None,
            minimum_skill_level=it.minimum_skill_level,
            quantity_required=it.quantity_required,
            wage_rate=it.wage_rate,
            wage_period=it.wage_period,
            duration=it.duration,
            schedule=it.schedule,
            filled_quantity=it.filled_quantity,
            status=it.status,
            created_at=it.created_at
        ))

    return LabourRequirementResponse(
        id=req.id,
        contractor_id=req.contractor_id,
        project_id=req.project_id,
        project_name=req.project.name if req.project else None,
        site_id=req.site_id,
        site_name=req.site.name if req.site else None,
        required_start_date=req.required_start_date,
        required_end_date=req.required_end_date,
        work_schedule=req.work_schedule,
        status=req.status,
        items=items,
        created_at=req.created_at,
        updated_at=req.updated_at
    )

@router.post("", response_model=StandardResponse[LabourRequirementResponse], status_code=status.HTTP_201_CREATED)
def create_labour_requirement(
    req: LabourRequirementCreateRequest,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    # 1. Validate dates
    if req.required_end_date < req.required_start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INVALID_DATES", "message": "End date cannot be earlier than start date"}
        )

    # 2. Validate project belongs to contractor
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project or project.contractor_id != contractor.id:
        raise UnauthorizedResource("Project does not exist or does not belong to contractor")

    # 3. Validate site belongs to project
    site = db.query(Site).filter(Site.id == req.site_id, Site.project_id == project.id).first()
    if not site:
        raise ResourceNotFound("Site does not exist or does not belong to specified project")

    # 4. Validate items: skill belongs to trade, quantity > 0, wage >= 0
    if not req.items or len(req.items) == 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="At least one requirement item must be provided")

    for item_data in req.items:
        skill = db.query(Skill).filter(Skill.id == item_data.skill_id).first()
        if not skill:
            raise ResourceNotFound(f"Skill ID {item_data.skill_id} not found")
        if skill.trade_id != item_data.trade_id:
            raise InvalidSkillForTrade(f"Skill '{skill.name}' does not belong to trade ID {item_data.trade_id}")

    # Create requirement
    labour_req = LabourRequirement(
        contractor_id=contractor.id,
        project_id=project.id,
        site_id=site.id,
        required_start_date=req.required_start_date,
        required_end_date=req.required_end_date,
        work_schedule=req.work_schedule,
        status=RequirementStatus.OPEN
    )
    db.add(labour_req)
    db.flush()

    for item_data in req.items:
        item = LabourRequirementItem(
            requirement_id=labour_req.id,
            trade_id=item_data.trade_id,
            skill_id=item_data.skill_id,
            minimum_skill_level=item_data.minimum_skill_level,
            quantity_required=item_data.quantity_required,
            wage_rate=item_data.wage_rate,
            wage_period=item_data.wage_period,
            duration=item_data.duration,
            schedule=item_data.schedule,
            filled_quantity=0,
            status=ItemStatus.OPEN
        )
        db.add(item)

    AuditService.log(
        db=db,
        actor_id=contractor.user_id,
        entity_type="LABOUR_REQUIREMENT",
        entity_id=labour_req.id,
        action="REQUIREMENT_CREATED",
        new_value={"project_id": project.id, "items_count": len(req.items)},
        reason="Contractor posted structured labour requirement"
    )

    db.commit()
    db.refresh(labour_req)
    return StandardResponse(data=serialize_requirement(labour_req), message="Labour requirement created successfully")

@router.get("", response_model=StandardResponse[List[LabourRequirementResponse]])
def list_contractor_requirements(
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    reqs = db.query(LabourRequirement).filter(LabourRequirement.contractor_id == contractor.id).all()
    return StandardResponse(data=[serialize_requirement(r) for r in reqs], message="Labour requirements fetched")

@router.get("/{requirement_id}", response_model=StandardResponse[LabourRequirementResponse])
def get_labour_requirement(
    requirement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    labour_req = db.query(LabourRequirement).filter(LabourRequirement.id == requirement_id).first()
    if not labour_req:
        raise ResourceNotFound("Labour requirement not found")

    if current_user.role == UserRole.CONTRACTOR and labour_req.contractor.user_id != current_user.id:
        raise UnauthorizedResource("Cannot access another contractor's labour requirement")

    return StandardResponse(data=serialize_requirement(labour_req), message="Labour requirement fetched")

@router.patch("/{requirement_id}", response_model=StandardResponse[LabourRequirementResponse])
def update_labour_requirement(
    requirement_id: int,
    req: LabourRequirementUpdateRequest,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    labour_req = db.query(LabourRequirement).filter(LabourRequirement.id == requirement_id).first()
    if not labour_req:
        raise ResourceNotFound("Labour requirement not found")
    if labour_req.contractor_id != contractor.id:
        raise UnauthorizedResource("Cannot edit another contractor's requirement")

    if req.work_schedule:
        labour_req.work_schedule = req.work_schedule
    if req.required_end_date:
        labour_req.required_end_date = req.required_end_date
    if req.status:
        labour_req.status = req.status

    db.commit()
    db.refresh(labour_req)
    return StandardResponse(data=serialize_requirement(labour_req), message="Requirement updated")

@router.post("/{requirement_id}/cancel", response_model=StandardResponse[dict])
def cancel_labour_requirement(
    requirement_id: int,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    labour_req = db.query(LabourRequirement).filter(LabourRequirement.id == requirement_id).first()
    if not labour_req:
        raise ResourceNotFound("Labour requirement not found")
    if labour_req.contractor_id != contractor.id:
        raise UnauthorizedResource("Cannot cancel another contractor's requirement")

    labour_req.status = RequirementStatus.CANCELLED
    for item in labour_req.items:
        item.status = ItemStatus.CANCELLED

    AuditService.log(
        db=db,
        actor_id=contractor.user_id,
        entity_type="LABOUR_REQUIREMENT",
        entity_id=labour_req.id,
        action="REQUIREMENT_CANCELLED",
        reason="Contractor cancelled requirement. History maintained."
    )
    db.commit()

    return StandardResponse(data={"requirement_id": labour_req.id, "status": "CANCELLED"}, message="Labour requirement cancelled")

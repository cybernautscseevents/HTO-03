from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role, get_current_contractor
from app.models.user import User, UserRole
from app.models.worker import Worker
from app.models.contractor import Contractor
from app.models.team_preferred import Team, TeamMember, PreferredWorker
from app.models.trade_skill import Trade, Skill
from app.models.requirement import LabourRequirement, LabourRequirementItem, RequirementStatus, ItemStatus, WagePeriod
from app.models.project import Project, Site
from app.schemas.team_preferred import (
    TeamCreateRequest, TeamResponse, TeamMemberCreateRequest, TeamMemberResponse,
    TeamRequirementExpandRequest, PreferredWorkerCreateRequest, PreferredWorkerResponse
)
from app.schemas.requirement import LabourRequirementResponse
from app.schemas.common import StandardResponse
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource
from app.routers.requirements import serialize_requirement

router = APIRouter(tags=["Teams & Preferred Workers"])

def serialize_team(team: Team) -> TeamResponse:
    members = []
    for m in team.members:
        members.append(TeamMemberResponse(
            id=m.id,
            trade_id=m.trade_id,
            trade_name=m.trade.name if m.trade else None,
            skill_id=m.skill_id,
            skill_name=m.skill.name if m.skill else None,
            minimum_skill_level=m.minimum_skill_level,
            quantity=m.quantity
        ))
    return TeamResponse(
        id=team.id,
        contractor_id=team.contractor_id,
        name=team.name,
        description=team.description,
        members=members,
        created_at=team.created_at
    )

# --- Preferred Workers ---

@router.post("/preferred-workers", response_model=StandardResponse[PreferredWorkerResponse], status_code=status.HTTP_201_CREATED)
def add_preferred_worker(
    req: PreferredWorkerCreateRequest,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    worker = db.query(Worker).filter(Worker.id == req.worker_id).first()
    if not worker:
        raise ResourceNotFound("Worker not found")

    existing = db.query(PreferredWorker).filter(
        PreferredWorker.contractor_id == contractor.id,
        PreferredWorker.worker_id == req.worker_id
    ).first()
    if existing:
        existing.notes = req.notes
        db.commit()
        db.refresh(existing)
        pw = existing
    else:
        pw = PreferredWorker(contractor_id=contractor.id, worker_id=req.worker_id, notes=req.notes)
        db.add(pw)
        db.commit()
        db.refresh(pw)

    return StandardResponse(
        data=PreferredWorkerResponse(
            id=pw.id,
            contractor_id=pw.contractor_id,
            worker_id=pw.worker_id,
            worker_name=worker.user.name,
            notes=pw.notes,
            created_at=pw.created_at
        ),
        message="Worker added to preferred list"
    )

@router.get("/preferred-workers", response_model=StandardResponse[List[PreferredWorkerResponse]])
def list_preferred_workers(
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    pws = db.query(PreferredWorker).filter(PreferredWorker.contractor_id == contractor.id).all()
    results = [
        PreferredWorkerResponse(
            id=p.id,
            contractor_id=p.contractor_id,
            worker_id=p.worker_id,
            worker_name=p.worker.user.name if (p.worker and p.worker.user) else None,
            notes=p.notes,
            created_at=p.created_at
        )
        for p in pws
    ]
    return StandardResponse(data=results, message="Preferred workers fetched")

@router.delete("/preferred-workers/{worker_id}", response_model=StandardResponse[dict])
def remove_preferred_worker(
    worker_id: int,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    pw = db.query(PreferredWorker).filter(
        PreferredWorker.contractor_id == contractor.id,
        PreferredWorker.worker_id == worker_id
    ).first()
    if not pw:
        raise ResourceNotFound("Worker not in preferred list")

    db.delete(pw)
    db.commit()
    return StandardResponse(data={"worker_id": worker_id, "removed": True}, message="Worker removed from preferred list")

# --- Teams & Team Hiring ---

@router.post("/teams", response_model=StandardResponse[TeamResponse], status_code=status.HTTP_201_CREATED)
def create_team_template(
    req: TeamCreateRequest,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    team = Team(contractor_id=contractor.id, name=req.name, description=req.description)
    db.add(team)
    db.flush()

    for m in req.members:
        member = TeamMember(
            team_id=team.id,
            trade_id=m.trade_id,
            skill_id=m.skill_id,
            minimum_skill_level=m.minimum_skill_level,
            quantity=m.quantity
        )
        db.add(member)

    db.commit()
    db.refresh(team)
    return StandardResponse(data=serialize_team(team), message="Team template created successfully")

@router.get("/teams", response_model=StandardResponse[List[TeamResponse]])
def list_teams(
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    teams = db.query(Team).filter(
        (Team.contractor_id == contractor.id) | (Team.contractor_id == None)
    ).all()
    return StandardResponse(data=[serialize_team(t) for t in teams], message="Team templates fetched")

@router.post("/teams/{team_id}/members", response_model=StandardResponse[TeamResponse])
def add_team_member(
    team_id: int,
    req: TeamMemberCreateRequest,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise ResourceNotFound("Team template not found")
    if team.contractor_id and team.contractor_id != contractor.id:
        raise UnauthorizedResource("Cannot edit another contractor's team template")

    member = TeamMember(
        team_id=team.id,
        trade_id=req.trade_id,
        skill_id=req.skill_id,
        minimum_skill_level=req.minimum_skill_level,
        quantity=req.quantity
    )
    db.add(member)
    db.commit()
    db.refresh(team)
    return StandardResponse(data=serialize_team(team), message="Team member added")

@router.post("/team-requirements", response_model=StandardResponse[LabourRequirementResponse], status_code=status.HTTP_201_CREATED)
def request_teams(
    req: TeamRequirementExpandRequest,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    """
    Expands team hiring request into individual structured requirement items.
    E.g. 5 Masonry Teams (1 Mason + 2 Helpers each) expands into:
    - 5 Masons
    - 10 Helpers
    """
    team = db.query(Team).filter(Team.id == req.team_id).first()
    if not team:
        raise ResourceNotFound("Team template not found")

    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project or project.contractor_id != contractor.id:
        raise UnauthorizedResource("Project does not exist or belong to contractor")

    site = db.query(Site).filter(Site.id == req.site_id, Site.project_id == project.id).first()
    if not site:
        raise ResourceNotFound("Site does not exist for this project")

    labour_req = LabourRequirement(
        contractor_id=contractor.id,
        project_id=project.id,
        site_id=site.id,
        required_start_date=req.required_start_date,
        required_end_date=req.required_end_date,
        work_schedule="08:00-17:00",
        status=RequirementStatus.OPEN
    )
    db.add(labour_req)
    db.flush()

    # Expand team members by team_count
    for m in team.members:
        expanded_qty = m.quantity * req.team_count
        # Default skill fallback to first skill in trade if skill_id is None
        skill_id = m.skill_id
        if not skill_id:
            first_skill = db.query(Skill).filter(Skill.trade_id == m.trade_id).first()
            skill_id = first_skill.id if first_skill else 1

        item = LabourRequirementItem(
            requirement_id=labour_req.id,
            trade_id=m.trade_id,
            skill_id=skill_id,
            minimum_skill_level=m.minimum_skill_level,
            quantity_required=expanded_qty,
            wage_rate=req.default_wage_rate,
            wage_period=WagePeriod.DAILY,
            duration="Team assignment",
            schedule="08:00-17:00",
            filled_quantity=0,
            status=ItemStatus.OPEN
        )
        db.add(item)

    AuditService.log(
        db=db,
        actor_id=contractor.user_id,
        entity_type="LABOUR_REQUIREMENT",
        entity_id=labour_req.id,
        action="TEAM_REQUIREMENT_EXPANDED",
        new_value={"team_id": team.id, "team_count": req.team_count},
        reason=f"Expanded {req.team_count}x '{team.name}' teams into individual requirement lines"
    )

    db.commit()
    db.refresh(labour_req)
    return StandardResponse(data=serialize_requirement(labour_req), message=f"Expanded {req.team_count} teams into structured labour requirement")

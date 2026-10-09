from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role, get_current_contractor
from app.models.user import User, UserRole
from app.models.contractor import Contractor
from app.models.project import Project, Site, ProjectStatus
from app.schemas.project import ProjectCreateRequest, ProjectUpdateRequest, ProjectResponse
from app.schemas.common import StandardResponse
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=StandardResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
def create_project(
    req: ProjectCreateRequest,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    project = Project(
        contractor_id=contractor.id,
        name=req.name,
        description=req.description,
        project_status=ProjectStatus.ACTIVE,
        start_date=req.start_date,
        expected_end_date=req.expected_end_date
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    AuditService.log(
        db=db,
        actor_id=contractor.user_id,
        entity_type="PROJECT",
        entity_id=project.id,
        action="PROJECT_CREATED",
        new_value={"name": project.name, "contractor_id": contractor.id},
        reason="Contractor initialized new project"
    )
    db.commit()

    return StandardResponse(data=ProjectResponse.model_validate(project), message="Project created successfully")

@router.get("", response_model=StandardResponse[List[ProjectResponse]])
def list_projects(
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    projects = db.query(Project).filter(Project.contractor_id == contractor.id).all()
    return StandardResponse(data=[ProjectResponse.model_validate(p) for p in projects], message="Projects fetched")

@router.get("/{project_id}", response_model=StandardResponse[ProjectResponse])
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ResourceNotFound("Project not found")

    # Access control
    if current_user.role == UserRole.CONTRACTOR and project.contractor.user_id != current_user.id:
        raise UnauthorizedResource("Cannot access another contractor's project")

    return StandardResponse(data=ProjectResponse.model_validate(project), message="Project fetched")

@router.patch("/{project_id}", response_model=StandardResponse[ProjectResponse])
def update_project(
    project_id: int,
    req: ProjectUpdateRequest,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ResourceNotFound("Project not found")
    if project.contractor_id != contractor.id:
        raise UnauthorizedResource("Cannot edit another contractor's project")

    if req.name:
        project.name = req.name
    if req.description:
        project.description = req.description
    if req.project_status:
        project.project_status = req.project_status
    if req.start_date:
        project.start_date = req.start_date
    if req.expected_end_date:
        project.expected_end_date = req.expected_end_date

    db.commit()
    db.refresh(project)
    return StandardResponse(data=ProjectResponse.model_validate(project), message="Project updated")

@router.delete("/{project_id}", response_model=StandardResponse[dict])
def cancel_project(
    project_id: int,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ResourceNotFound("Project not found")
    if project.contractor_id != contractor.id:
        raise UnauthorizedResource("Cannot cancel another contractor's project")

    # Important Business Rule: Do NOT physically delete projects with history; mark CANCELLED!
    project.project_status = ProjectStatus.CANCELLED
    AuditService.log(
        db=db,
        actor_id=contractor.user_id,
        entity_type="PROJECT",
        entity_id=project.id,
        action="PROJECT_CANCELLED",
        reason="Contractor cancelled project. Historical workforce records preserved."
    )
    db.commit()

    return StandardResponse(data={"project_id": project.id, "status": "CANCELLED"}, message="Project status set to CANCELLED")

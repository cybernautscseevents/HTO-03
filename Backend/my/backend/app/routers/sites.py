from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role, get_current_contractor
from app.models.user import User, UserRole
from app.models.contractor import Contractor
from app.models.project import Project, Site
from app.schemas.project import SiteCreateRequest, SiteUpdateRequest, SiteResponse
from app.schemas.common import StandardResponse
from app.services.audit_service import AuditService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

router = APIRouter(tags=["Sites"])

@router.post("/projects/{project_id}/sites", response_model=StandardResponse[SiteResponse], status_code=status.HTTP_201_CREATED)
def create_site(
    project_id: int,
    req: SiteCreateRequest,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ResourceNotFound("Project not found")
    if project.contractor_id != contractor.id:
        raise UnauthorizedResource("Cannot add site to another contractor's project")

    site = Site(
        project_id=project.id,
        name=req.name,
        address=req.address,
        region=req.region,
        supervisor_id=req.supervisor_id,
        active=True
    )
    db.add(site)
    db.commit()
    db.refresh(site)

    AuditService.log(
        db=db,
        actor_id=contractor.user_id,
        entity_type="SITE",
        entity_id=site.id,
        action="SITE_CREATED",
        new_value={"name": site.name, "region": site.region, "project_id": project.id},
        reason="Contractor added construction site without GPS requirement"
    )
    db.commit()

    return StandardResponse(data=SiteResponse.model_validate(site), message="Site created successfully")

@router.get("/projects/{project_id}/sites", response_model=StandardResponse[List[SiteResponse]])
def list_sites_for_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ResourceNotFound("Project not found")

    sites = db.query(Site).filter(Site.project_id == project_id).all()
    return StandardResponse(data=[SiteResponse.model_validate(s) for s in sites], message="Sites fetched")

@router.get("/sites/{site_id}", response_model=StandardResponse[SiteResponse])
def get_site(
    site_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise ResourceNotFound("Site not found")
    return StandardResponse(data=SiteResponse.model_validate(site), message="Site fetched")

@router.patch("/sites/{site_id}", response_model=StandardResponse[SiteResponse])
def update_site(
    site_id: int,
    req: SiteUpdateRequest,
    contractor: Contractor = Depends(get_current_contractor),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise ResourceNotFound("Site not found")
    if site.project.contractor_id != contractor.id:
        raise UnauthorizedResource("Cannot edit another contractor's site")

    if req.name:
        site.name = req.name
    if req.address:
        site.address = req.address
    if req.region:
        site.region = req.region
    if req.supervisor_id is not None:
        site.supervisor_id = req.supervisor_id
    if req.active is not None:
        site.active = req.active

    db.commit()
    db.refresh(site)
    return StandardResponse(data=SiteResponse.model_validate(site), message="Site updated")

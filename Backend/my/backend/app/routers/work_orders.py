from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.worker import Worker
from app.models.contractor import Contractor
from app.models.work_order import WorkOrder, WorkOrderVersion
from app.schemas.work_order import WorkOrderResponse, WorkOrderVersionResponse, WorkOrderVersionCreateRequest
from app.schemas.common import StandardResponse
from app.services.work_order_service import WorkOrderService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

router = APIRouter(tags=["Work Orders"])

def serialize_work_order(wo: WorkOrder) -> WorkOrderResponse:
    versions = []
    for v in sorted(wo.versions, key=lambda x: x.version_number):
        versions.append(WorkOrderVersionResponse(
            id=v.id,
            work_order_id=v.work_order_id,
            version_number=v.version_number,
            agreed_wage_rate=v.agreed_wage_rate,
            wage_period=v.wage_period,
            start_date=v.start_date,
            end_date=v.end_date,
            working_schedule=v.working_schedule,
            terms_text=v.terms_text,
            changed_by=v.changed_by,
            changed_at=v.changed_at,
            reason=v.reason,
            worker_confirmed=v.worker_confirmed,
            confirmed_at=v.confirmed_at,
            created_at=v.created_at
        ))

    return WorkOrderResponse(
        id=wo.id,
        requirement_item_id=wo.requirement_item_id,
        contractor_id=wo.contractor_id,
        worker_id=wo.worker_id,
        worker_name=wo.worker.user.name if (wo.worker and wo.worker.user) else None,
        project_id=wo.project_id,
        project_name=wo.project.name if wo.project else None,
        site_id=wo.site_id,
        site_name=wo.site.name if wo.site else None,
        trade_id=wo.trade_id,
        trade_name=wo.trade.name if wo.trade else None,
        role_title=wo.role_title,
        current_version_id=wo.current_version_id,
        status=wo.status,
        acceptance_timestamp=wo.acceptance_timestamp,
        versions=versions,
        created_at=wo.created_at,
        updated_at=wo.updated_at
    )

@router.get("/work-orders", response_model=StandardResponse[List[WorkOrderResponse]])
def list_work_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(WorkOrder)
    if current_user.role == UserRole.WORKER:
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if not worker:
            return StandardResponse(data=[], message="No worker profile")
        query = query.filter(WorkOrder.worker_id == worker.id)
    elif current_user.role == UserRole.CONTRACTOR:
        contractor = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
        if not contractor:
            return StandardResponse(data=[], message="No contractor profile")
        query = query.filter(WorkOrder.contractor_id == contractor.id)

    wos = query.order_by(WorkOrder.created_at.desc()).all()
    return StandardResponse(data=[serialize_work_order(w) for w in wos], message="Work orders fetched")

@router.get("/work-orders/{work_order_id}", response_model=StandardResponse[WorkOrderResponse])
def get_work_order(
    work_order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise ResourceNotFound("Work order not found")

    if current_user.role == UserRole.WORKER and wo.worker.user_id != current_user.id:
        raise UnauthorizedResource("Cannot access another worker's work order")
    if current_user.role == UserRole.CONTRACTOR and wo.contractor.user_id != current_user.id:
        raise UnauthorizedResource("Cannot access another contractor's work order")

    return StandardResponse(data=serialize_work_order(wo), message="Work order fetched")

@router.post("/work-orders/{work_order_id}/versions", response_model=StandardResponse[WorkOrderVersionResponse], status_code=status.HTTP_201_CREATED)
def create_revised_work_order_version(
    work_order_id: int,
    req: WorkOrderVersionCreateRequest,
    current_user: User = Depends(require_role([UserRole.CONTRACTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    version = WorkOrderService.create_revised_version(
        db=db,
        work_order_id=work_order_id,
        modifier_user=current_user,
        data=req
    )
    return StandardResponse(data=WorkOrderVersionResponse.model_validate(version), message="Revised work order version created. Worker confirmation required.")

@router.post("/work-order-versions/{version_id}/confirm", response_model=StandardResponse[WorkOrderVersionResponse])
def confirm_revised_work_order_version(
    version_id: int,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    version = WorkOrderService.confirm_version(
        db=db,
        version_id=version_id,
        worker_user=current_user
    )
    return StandardResponse(data=WorkOrderVersionResponse.model_validate(version), message="Revised work order version confirmed by worker.")

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.requirement import LabourRequirement
from app.schemas.matching import RequirementMatchesResponse
from app.schemas.common import StandardResponse
from app.services.matching_service import MatchingService
from app.utils.exceptions import ResourceNotFound, UnauthorizedResource

router = APIRouter(tags=["Matching"])

@router.get("/labour-requirements/{requirement_id}/matches", response_model=StandardResponse[RequirementMatchesResponse])
def get_matches_for_requirement(
    requirement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(LabourRequirement).filter(LabourRequirement.id == requirement_id).first()
    if not req:
        raise ResourceNotFound("Labour requirement not found")

    if current_user.role == UserRole.CONTRACTOR and req.contractor.user_id != current_user.id:
        raise UnauthorizedResource("Cannot view matches for another contractor's requirement")

    results = MatchingService.match_requirement(db, requirement_id)
    return StandardResponse(data=results, message="Explainable matching executed successfully")

from typing import List, Optional
from pydantic import BaseModel
from app.models.worker import WorkerAvailability

class WorkerMatchedSkill(BaseModel):
    name: str
    level: str  # BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    verification: str

class WorkerMatchItem(BaseModel):
    worker_id: int
    name: str
    trade: str
    skills: List[WorkerMatchedSkill]
    availability: WorkerAvailability
    is_preferred: bool = False
    region: Optional[str] = None
    attendance_rate: Optional[float] = None
    match_status: str = "MATCHED"  # MATCHED or NOT_MATCHED
    match_reasons: List[str]
    disqualification_reasons: List[str] = []

class RequirementItemMatchResult(BaseModel):
    requirement_item_id: int
    trade_name: str
    skill_name: str
    minimum_skill_level: int
    wage_rate: float
    quantity_required: int
    filled_quantity: int
    matched_workers: List[WorkerMatchItem] = []
    unmatched_workers: List[WorkerMatchItem] = []

class RequirementMatchesResponse(BaseModel):
    requirement_id: int
    project_id: int
    site_id: int
    results_by_item: List[RequirementItemMatchResult] = []

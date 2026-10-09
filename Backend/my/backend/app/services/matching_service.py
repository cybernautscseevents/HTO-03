from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.worker import Worker, WorkerAvailability
from app.models.trade_skill import WorkerSkill, Skill, Trade, SkillLevel
from app.models.requirement import LabourRequirementItem, LabourRequirement
from app.models.assignment import Assignment, AssignmentStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.team_preferred import PreferredWorker
from app.schemas.matching import WorkerMatchItem, WorkerMatchedSkill, RequirementItemMatchResult, RequirementMatchesResponse
from app.utils.exceptions import ResourceNotFound

LEVEL_MAP = {
    1: "BEGINNER",
    2: "INTERMEDIATE",
    3: "ADVANCED",
    4: "EXPERT"
}

class MatchingService:
    @staticmethod
    def calculate_worker_attendance_rate(db: Session, worker_id: int) -> float:
        total_att = db.query(Attendance).filter(Attendance.worker_id == worker_id).count()
        if total_att == 0:
            return 95.0  # Default baseline for demonstration if unrecorded
        present_att = db.query(Attendance).filter(
            Attendance.worker_id == worker_id,
            Attendance.attendance_status == AttendanceStatus.PRESENT
        ).count()
        return round((present_att / total_att) * 100, 1)

    @staticmethod
    def evaluate_worker(
        db: Session,
        worker: Worker,
        item: LabourRequirementItem,
        req: LabourRequirement,
        is_preferred: bool
    ) -> WorkerMatchItem:
        match_reasons: List[str] = []
        disqualifications: List[str] = []

        # 1. Fetch skills for this worker
        worker_skills = db.query(WorkerSkill).filter(WorkerSkill.worker_id == worker.id).all()
        skill_items: List[WorkerMatchedSkill] = []
        has_trade_match = False
        has_skill_match = False
        skill_level_sufficient = False
        matched_level_name = ""

        for ws in worker_skills:
            sk = db.query(Skill).filter(Skill.id == ws.skill_id).first()
            if not sk:
                continue
            tr = db.query(Trade).filter(Trade.id == sk.trade_id).first()
            tr_name = tr.name if tr else "Unknown"
            level_name = LEVEL_MAP.get(ws.skill_level, "BEGINNER")
            skill_items.append(WorkerMatchedSkill(
                name=sk.name,
                level=level_name,
                verification=ws.verification_status.value
            ))

            if sk.trade_id == item.trade_id:
                has_trade_match = True

            if ws.skill_id == item.skill_id:
                has_skill_match = True
                matched_level_name = level_name
                if ws.skill_level >= item.minimum_skill_level:
                    skill_level_sufficient = True
                else:
                    disqualifications.append(
                        f"Skill level {level_name} is below required minimum ({LEVEL_MAP.get(item.minimum_skill_level, 'INTERMEDIATE')})"
                    )

        if not has_trade_match:
            disqualifications.append(f"Trade mismatch (Worker trade skills do not include required trade)")
        else:
            match_reasons.append("Trade matches")

        if not has_skill_match:
            disqualifications.append("Required skill not present in worker profile")
        elif skill_level_sufficient:
            match_reasons.append("Required skill matches")
            req_min_name = LEVEL_MAP.get(item.minimum_skill_level, "INTERMEDIATE")
            if matched_level_name == req_min_name:
                match_reasons.append(f"Skill level meets minimum ({req_min_name})")
            else:
                match_reasons.append(f"Skill level exceeds minimum ({matched_level_name} > {req_min_name})")

        # 2. Worker availability
        if worker.availability_status == WorkerAvailability.AVAILABLE:
            match_reasons.append("Worker is available")
        else:
            disqualifications.append(f"Worker status is {worker.availability_status.value}")

        # 3. Assignment conflicts
        conflicting = db.query(Assignment).filter(
            Assignment.worker_id == worker.id,
            Assignment.status.in_([AssignmentStatus.ACTIVE, AssignmentStatus.ASSIGNED]),
            or_(
                and_(Assignment.start_date <= req.required_end_date, Assignment.end_date >= req.required_start_date)
            )
        ).first()

        if conflicting:
            disqualifications.append(f"Worker has conflicting active assignment (#{conflicting.id})")
        else:
            match_reasons.append("No conflicting assignment")

        # 4. Wage compatibility
        if worker.expected_daily_wage is not None:
            if item.wage_rate >= worker.expected_daily_wage:
                match_reasons.append(f"Wage compatible (Offered ₹{item.wage_rate} >= Expected ₹{worker.expected_daily_wage})")
            else:
                disqualifications.append(f"Wage lower than expected (Offered ₹{item.wage_rate} < Expected ₹{worker.expected_daily_wage})")
        else:
            match_reasons.append(f"Offered wage (₹{item.wage_rate}/day) compatible")

        # 5. Reliability indicator
        att_rate = MatchingService.calculate_worker_attendance_rate(db, worker.id)
        if att_rate >= 80.0:
            match_reasons.append(f"High attendance reliability ({att_rate}%)")

        # 6. Preferred worker bonus
        if is_preferred:
            match_reasons.append("Contractor preferred worker")

        # 7. Region alignment
        if req.site and worker.current_work_region and req.site.region:
            if worker.current_work_region.lower() in req.site.region.lower() or req.site.region.lower() in worker.current_work_region.lower():
                match_reasons.append(f"Work region aligns ({worker.current_work_region})")

        is_match = (len(disqualifications) == 0)
        primary_trade = item.trade.name if item.trade else "Construction"

        return WorkerMatchItem(
            worker_id=worker.id,
            name=worker.user.name if worker.user else f"Worker #{worker.id}",
            trade=primary_trade,
            skills=skill_items,
            availability=worker.availability_status,
            is_preferred=is_preferred,
            region=worker.current_work_region,
            attendance_rate=att_rate,
            match_status="MATCHED" if is_match else "NOT_MATCHED",
            match_reasons=match_reasons if is_match else [],
            disqualification_reasons=disqualifications
        )

    @staticmethod
    def match_requirement(db: Session, requirement_id: int) -> RequirementMatchesResponse:
        req = db.query(LabourRequirement).filter(LabourRequirement.id == requirement_id).first()
        if not req:
            raise ResourceNotFound(f"Labour requirement #{requirement_id} not found")

        preferred_worker_ids = set([
            pw.worker_id for pw in db.query(PreferredWorker).filter(
                PreferredWorker.contractor_id == req.contractor_id
            ).all()
        ])

        all_workers = db.query(Worker).all()
        results: List[RequirementItemMatchResult] = []

        for item in req.items:
            matched_list: List[WorkerMatchItem] = []
            unmatched_list: List[WorkerMatchItem] = []

            for worker in all_workers:
                is_pref = worker.id in preferred_worker_ids
                eval_result = MatchingService.evaluate_worker(db, worker, item, req, is_pref)
                if eval_result.match_status == "MATCHED":
                    matched_list.append(eval_result)
                else:
                    unmatched_list.append(eval_result)

            # Sort matched: preferred first, then higher attendance rate
            matched_list.sort(key=lambda w: (1 if w.is_preferred else 0, w.attendance_rate or 0), reverse=True)

            results.append(RequirementItemMatchResult(
                requirement_item_id=item.id,
                trade_name=item.trade.name if item.trade else "",
                skill_name=item.skill.name if item.skill else "",
                minimum_skill_level=item.minimum_skill_level,
                wage_rate=item.wage_rate,
                quantity_required=item.quantity_required,
                filled_quantity=item.filled_quantity,
                matched_workers=matched_list,
                unmatched_workers=unmatched_list
            ))

        return RequirementMatchesResponse(
            requirement_id=req.id,
            project_id=req.project_id,
            site_id=req.site_id,
            results_by_item=results
        )

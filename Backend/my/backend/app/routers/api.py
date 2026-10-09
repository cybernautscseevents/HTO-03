from fastapi import APIRouter
from app.routers import (
    auth, workers, contractors, trades_skills, projects, sites,
    requirements, matching, offers, work_orders, assignments,
    attendance, wages_payments, disputes, incidents, sos,
    team_preferred, voice_comm, audit, dev_mock
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(workers.router)
api_router.include_router(contractors.router)
api_router.include_router(trades_skills.router)
api_router.include_router(projects.router)
api_router.include_router(sites.router)
api_router.include_router(requirements.router)
api_router.include_router(matching.router)
api_router.include_router(offers.router)
api_router.include_router(work_orders.router)
api_router.include_router(assignments.router)
api_router.include_router(attendance.router)
api_router.include_router(wages_payments.router)
api_router.include_router(disputes.router)
api_router.include_router(incidents.router)
api_router.include_router(sos.router)
api_router.include_router(team_preferred.router)
api_router.include_router(voice_comm.router)
api_router.include_router(audit.router)
api_router.include_router(dev_mock.router)

from pydantic import BaseModel

class WorkerPerformanceResponse(BaseModel):
    worker_id: int
    worker_name: str
    attendance_rate: float
    on_time_rate: float
    acceptance_rate: float
    no_show_rate: float
    completed_assignments: int
    cancellation_rate: float
    supervisor_confirmations: int
    total_shifts: int

class ContractorPerformanceResponse(BaseModel):
    contractor_id: int
    company_name: str
    payment_timeliness: float
    cancellation_rate: float
    worker_disputes: int
    wage_disputes: int
    completed_projects: int
    complaints: int
    total_assignments: int

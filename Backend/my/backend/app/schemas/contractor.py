from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ContractorCreateRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=150)
    contact_person: str = Field(..., min_length=2, max_length=120)

class ContractorUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None

class ContractorResponse(BaseModel):
    id: int
    user_id: int
    company_name: str
    contact_person: str
    verification_status: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

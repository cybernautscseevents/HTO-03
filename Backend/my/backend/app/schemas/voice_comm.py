from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field
from app.models.voice_comm import CommChannel, CommStatus

class MockCallInputRequest(BaseModel):
    input: str = Field(..., description="'1' to accept offer, '2' to reject offer")

class VoiceWebhookRequest(BaseModel):
    offer_id: int
    input: str = Field(..., description="DTMF digit: '1' (ACCEPT) or '2' (REJECT)")
    provider_call_id: Optional[str] = None
    call_duration_seconds: Optional[int] = None

class CommunicationLogResponse(BaseModel):
    id: int
    worker_id: int
    contractor_id: Optional[int] = None
    offer_id: Optional[int] = None
    communication_type: str
    channel: CommChannel
    status: CommStatus
    attempt_number: int
    provider_reference: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VoiceEvidenceCreateRequest(BaseModel):
    worker_id: int
    contractor_id: int
    assignment_id: Optional[int] = None
    storage_path: str
    transcript: Optional[str] = None
    extracted_terms: Optional[Dict[str, Any]] = None

class VoiceEvidenceResponse(BaseModel):
    id: int
    worker_id: int
    contractor_id: int
    assignment_id: Optional[int] = None
    consent_status: str
    storage_path: str
    transcript: Optional[str] = None
    extracted_terms: Optional[Dict[str, Any]] = None
    recorded_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.voice_comm import CommunicationLog, VoiceEvidence, CommChannel, CommStatus
from app.schemas.voice_comm import (
    VoiceWebhookRequest, CommunicationLogResponse, VoiceEvidenceCreateRequest, VoiceEvidenceResponse
)
from app.schemas.common import StandardResponse
from app.services.voice_provider_service import VoiceProviderService
from app.utils.exceptions import ResourceNotFound

router = APIRouter(tags=["Voice & Communications"])

@router.post("/voice/offers/{offer_id}/call", response_model=StandardResponse[CommunicationLogResponse])
def initiate_voice_call(
    offer_id: int,
    current_user: User = Depends(require_role([UserRole.CONTRACTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    log = VoiceProviderService.initiate_offer_call(db, offer_id)
    return StandardResponse(data=CommunicationLogResponse.model_validate(log), message="Automated voice call initiated to worker")

@router.post("/voice/webhook", response_model=StandardResponse[dict])
def voice_provider_webhook(
    req: VoiceWebhookRequest,
    db: Session = Depends(get_db)
):
    """
    Webhook called by telecom/voice provider when worker presses keypad/DTMF button:
    1 = ACCEPT
    2 = REJECT
    """
    result = VoiceProviderService.process_dtmf_input(
        db=db,
        offer_id=req.offer_id,
        input_digit=req.input,
        provider_call_id=req.provider_call_id
    )
    return StandardResponse(data=result, message="Webhook processed successfully")

@router.get("/communications", response_model=StandardResponse[List[CommunicationLogResponse]])
def list_communications(
    offer_id: Optional[int] = Query(None),
    worker_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(CommunicationLog)
    if offer_id:
        query = query.filter(CommunicationLog.offer_id == offer_id)
    if worker_id:
        query = query.filter(CommunicationLog.worker_id == worker_id)

    logs = query.order_by(CommunicationLog.created_at.desc()).all()
    return StandardResponse(data=[CommunicationLogResponse.model_validate(l) for l in logs], message="Communication logs fetched")

@router.post("/voice-evidence", response_model=StandardResponse[VoiceEvidenceResponse], status_code=status.HTTP_201_CREATED)
def record_voice_evidence(
    req: VoiceEvidenceCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ev = VoiceEvidence(
        worker_id=req.worker_id,
        contractor_id=req.contractor_id,
        assignment_id=req.assignment_id,
        consent_status="CONSENTED",
        storage_path=req.storage_path,  # Audio URI in cloud object storage, NOT raw bytes in DB
        transcript=req.transcript,
        extracted_terms=req.extracted_terms
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return StandardResponse(data=VoiceEvidenceResponse.model_validate(ev), message="Voice evidence record saved")

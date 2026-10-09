from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.schemas.voice_comm import MockCallInputRequest, CommunicationLogResponse
from app.schemas.common import StandardResponse
from app.services.voice_provider_service import VoiceProviderService

router = APIRouter(prefix="/dev", tags=["Development & Testing Mocks"])

@router.post("/mock-call/{offer_id}", response_model=StandardResponse[CommunicationLogResponse])
def dev_simulate_voice_call(offer_id: int, db: Session = Depends(get_db)):
    if settings.APP_ENV == "production":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dev endpoints disabled in production")

    log = VoiceProviderService.initiate_offer_call(db, offer_id, provider_reference=f"dev_mock_call_{offer_id}")
    return StandardResponse(data=CommunicationLogResponse.model_validate(log), message="Simulated phone call placed to worker")

@router.post("/mock-call/{offer_id}/input", response_model=StandardResponse[dict])
def dev_simulate_dtmf_input(offer_id: int, req: MockCallInputRequest, db: Session = Depends(get_db)):
    if settings.APP_ENV == "production":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dev endpoints disabled in production")

    result = VoiceProviderService.process_dtmf_input(
        db=db,
        offer_id=offer_id,
        input_digit=req.input,
        provider_call_id=f"dev_dtmf_{offer_id}"
    )
    return StandardResponse(data=result, message=f"Simulated DTMF button '{req.input}' processed")

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.offer import JobOffer, OfferStatus
from app.models.voice_comm import CommunicationLog, CommChannel, CommStatus
from app.services.offer_service import OfferService
from app.utils.exceptions import ResourceNotFound

class VoiceProviderService:
    """
    Provider-independent abstraction for voice / IVR calls and DTMF interaction.
    Allows testing/mocking in dev, and swapping with real telecom APIs in production.
    """

    @staticmethod
    def initiate_offer_call(
        db: Session,
        offer_id: int,
        provider_reference: Optional[str] = None
    ) -> CommunicationLog:
        offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
        if not offer:
            raise ResourceNotFound(f"Job offer #{offer_id} not found")

        worker = offer.worker
        contractor = offer.requirement_item.requirement.contractor

        # Count prior attempts
        attempts = db.query(CommunicationLog).filter(
            CommunicationLog.offer_id == offer.id,
            CommunicationLog.channel == CommChannel.IVR
        ).count()

        comm_log = CommunicationLog(
            worker_id=worker.id,
            contractor_id=contractor.id,
            offer_id=offer.id,
            communication_type="JOB_OFFER_VOICE_CALL",
            channel=CommChannel.IVR,
            status=CommStatus.CALLING,
            attempt_number=attempts + 1,
            provider_reference=provider_reference or f"mock_call_{offer.id}_{attempts + 1}",
            details={
                "message": f"KaamConnect: You have a {offer.requirement_item.trade.name} job opportunity. Press 1 to accept. Press 2 to reject.",
                "offered_wage": offer.offered_wage
            }
        )
        db.add(comm_log)
        db.commit()
        db.refresh(comm_log)
        return comm_log

    @staticmethod
    def process_dtmf_input(
        db: Session,
        offer_id: int,
        input_digit: str,
        provider_call_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Handles IVR DTMF Keypad digit:
        "1" -> Accept offer, trigger transactional assignment & work order, release contact.
        "2" -> Reject offer, do not release contact, allow matching other workers.
        """
        offer = db.query(JobOffer).filter(JobOffer.id == offer_id).first()
        if not offer:
            raise ResourceNotFound(f"Job offer #{offer_id} not found")

        worker = offer.worker
        contractor = offer.requirement_item.requirement.contractor

        if input_digit.strip() == "1":
            # 1 = ACCEPT
            result = OfferService.accept_offer(db, offer_id=offer_id, is_automated_system=True)
            
            comm_log = CommunicationLog(
                worker_id=worker.id,
                contractor_id=contractor.id,
                offer_id=offer.id,
                communication_type="IVR_DTMF_RESPONSE",
                channel=CommChannel.IVR,
                status=CommStatus.ACCEPTED,
                attempt_number=1,
                provider_reference=provider_call_id or f"dtmf_accept_{offer.id}",
                details={"input": "1", "action": "ACCEPTED"}
            )
            db.add(comm_log)
            db.commit()

            return {
                "success": True,
                "action": "ACCEPTED",
                "offer_id": offer.id,
                "work_order_id": result.get("work_order_id"),
                "assignment_id": result.get("assignment_id"),
                "contact_released": True,
                "message": "Offer accepted via automated IVR DTMF input 1"
            }

        elif input_digit.strip() == "2":
            # 2 = REJECT
            OfferService.reject_offer(db, offer_id=offer_id, is_automated_system=True)

            comm_log = CommunicationLog(
                worker_id=worker.id,
                contractor_id=contractor.id,
                offer_id=offer.id,
                communication_type="IVR_DTMF_RESPONSE",
                channel=CommChannel.IVR,
                status=CommStatus.REJECTED,
                attempt_number=1,
                provider_reference=provider_call_id or f"dtmf_reject_{offer.id}",
                details={"input": "2", "action": "REJECTED"}
            )
            db.add(comm_log)
            db.commit()

            return {
                "success": True,
                "action": "REJECTED",
                "offer_id": offer.id,
                "contact_released": False,
                "message": "Offer rejected via automated IVR DTMF input 2. Worker contact withheld."
            }

        else:
            comm_log = CommunicationLog(
                worker_id=worker.id,
                contractor_id=contractor.id,
                offer_id=offer.id,
                communication_type="IVR_DTMF_RESPONSE",
                channel=CommChannel.IVR,
                status=CommStatus.FAILED,
                attempt_number=1,
                provider_reference=provider_call_id or f"dtmf_invalid_{offer.id}",
                details={"input": input_digit, "action": "INVALID_INPUT"}
            )
            db.add(comm_log)
            db.commit()

            return {
                "success": False,
                "action": "INVALID_INPUT",
                "offer_id": offer.id,
                "message": f"Unrecognized DTMF digit '{input_digit}'. Press 1 to accept or 2 to reject."
            }

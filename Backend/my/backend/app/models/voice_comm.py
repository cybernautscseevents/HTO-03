import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class CommChannel(str, enum.Enum):
    APP = "APP"
    SMS = "SMS"
    IVR = "IVR"
    VOICE = "VOICE"
    OTHER = "OTHER"

class CommStatus(str, enum.Enum):
    CALLING = "CALLING"
    ANSWERED = "ANSWERED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    NO_RESPONSE = "NO_RESPONSE"
    INVALID_NUMBER = "INVALID_NUMBER"
    FAILED = "FAILED"

class VoiceEvidence(Base):
    __tablename__ = "voice_evidences"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True, index=True)
    consent_status = Column(String(50), default="CONSENTED", nullable=False)
    storage_path = Column(String(255), nullable=False)  # Object storage URI (e.g. S3/GCS bucket path)
    transcript = Column(Text, nullable=True)
    extracted_terms = Column(JSON, nullable=True)  # { "wage": 900, "duration": "3 months", "role": "Mason" }
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    retention_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    worker = relationship("Worker")
    contractor = relationship("Contractor")
    assignment = relationship("Assignment")

class CommunicationLog(Base):
    __tablename__ = "communication_logs"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="SET NULL"), nullable=True, index=True)
    offer_id = Column(Integer, ForeignKey("job_offers.id", ondelete="SET NULL"), nullable=True, index=True)
    communication_type = Column(String(50), default="JOB_OFFER", nullable=False)
    channel = Column(Enum(CommChannel), default=CommChannel.IVR, nullable=False)
    status = Column(Enum(CommStatus), default=CommStatus.CALLING, nullable=False, index=True)
    attempt_number = Column(Integer, default=1, nullable=False)
    provider_reference = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    worker = relationship("Worker")
    contractor = relationship("Contractor")
    offer = relationship("JobOffer")

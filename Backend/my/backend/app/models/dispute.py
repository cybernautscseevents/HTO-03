import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class DisputeType(str, enum.Enum):
    ATTENDANCE = "ATTENDANCE"
    WAGE = "WAGE"
    PAYMENT = "PAYMENT"
    WORK_ORDER = "WORK_ORDER"
    CANCELLATION = "CANCELLATION"
    IDENTITY = "IDENTITY"
    SKILL = "SKILL"
    OTHER = "OTHER"

class DisputeStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    raised_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True, index=True)
    attendance_id = Column(Integer, ForeignKey("attendances.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_id = Column(Integer, ForeignKey("payment_records.id", ondelete="SET NULL"), nullable=True, index=True)
    dispute_type = Column(Enum(DisputeType), nullable=False, index=True)
    description = Column(Text, nullable=False)
    status = Column(Enum(DisputeStatus), default=DisputeStatus.OPEN, nullable=False, index=True)
    resolution = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    initiator = relationship("User", foreign_keys=[raised_by])
    resolver = relationship("User", foreign_keys=[resolved_by])
    worker = relationship("Worker", back_populates="disputes")
    contractor = relationship("Contractor")
    assignment = relationship("Assignment")
    attendance = relationship("Attendance")
    payment = relationship("PaymentRecord", back_populates="disputes")
    responses = relationship("DisputeResponse", back_populates="dispute", cascade="all, delete-orphan")

class DisputeResponse(Base):
    __tablename__ = "dispute_responses"

    id = Column(Integer, primary_key=True, index=True)
    dispute_id = Column(Integer, ForeignKey("disputes.id", ondelete="CASCADE"), nullable=False, index=True)
    responder_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    message = Column(Text, nullable=False)
    evidence_reference = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    dispute = relationship("Dispute", back_populates="responses")
    responder = relationship("User")

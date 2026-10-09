import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class WorkerAvailability(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    UNAVAILABLE = "UNAVAILABLE"
    WORKING = "WORKING"
    ASSIGNED = "ASSIGNED"
    ON_LEAVE = "ON_LEAVE"
    UNKNOWN = "UNKNOWN"

class WorkerVerificationStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    BASIC_VERIFIED = "BASIC_VERIFIED"
    FULLY_VERIFIED = "FULLY_VERIFIED"

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    preferred_language = Column(String(20), default="hi", nullable=False)
    home_region = Column(String(120), nullable=True)
    current_work_region = Column(String(120), nullable=True)
    expected_daily_wage = Column(Float, nullable=True)
    availability_status = Column(Enum(WorkerAvailability), default=WorkerAvailability.AVAILABLE, nullable=False, index=True)
    profile_status = Column(String(50), default="ACTIVE", nullable=False)
    verification_status = Column(Enum(WorkerVerificationStatus), default=WorkerVerificationStatus.UNVERIFIED, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="worker_profile")
    skills = relationship("WorkerSkill", back_populates="worker", cascade="all, delete-orphan")
    job_offers = relationship("JobOffer", back_populates="worker")
    assignments = relationship("Assignment", back_populates="worker")
    attendances = relationship("Attendance", back_populates="worker")
    payment_records = relationship("PaymentRecord", back_populates="worker")
    contact_releases = relationship("WorkerContactRelease", back_populates="worker")
    disputes = relationship("Dispute", back_populates="worker")

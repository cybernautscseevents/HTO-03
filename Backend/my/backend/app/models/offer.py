import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class OfferStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class JobOffer(Base):
    __tablename__ = "job_offers"

    id = Column(Integer, primary_key=True, index=True)
    requirement_item_id = Column(Integer, ForeignKey("labour_requirement_items.id", ondelete="CASCADE"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    offered_wage = Column(Float, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    status = Column(Enum(OfferStatus), default=OfferStatus.PENDING, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    responded_at = Column(DateTime, nullable=True)

    # Relationships
    requirement_item = relationship("LabourRequirementItem", back_populates="job_offers")
    worker = relationship("Worker", back_populates="job_offers")
    contact_releases = relationship("WorkerContactRelease", back_populates="offer", cascade="all, delete-orphan")

class WorkerContactRelease(Base):
    __tablename__ = "worker_contact_releases"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False, index=True)
    offer_id = Column(Integer, ForeignKey("job_offers.id", ondelete="CASCADE"), nullable=False, index=True)
    released_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    release_reason = Column(String(255), default="Job offer accepted by worker", nullable=False)

    # Relationships
    worker = relationship("Worker", back_populates="contact_releases")
    contractor = relationship("Contractor")
    offer = relationship("JobOffer", back_populates="contact_releases")

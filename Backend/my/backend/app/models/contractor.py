from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    company_name = Column(String(150), nullable=False)
    contact_person = Column(String(120), nullable=False)
    verification_status = Column(String(50), default="UNVERIFIED", nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="contractor_profile")
    projects = relationship("Project", back_populates="contractor", cascade="all, delete-orphan")
    labour_requirements = relationship("LabourRequirement", back_populates="contractor")
    work_orders = relationship("WorkOrder", back_populates="contractor")
    preferred_workers = relationship("PreferredWorker", back_populates="contractor", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="contractor", cascade="all, delete-orphan")

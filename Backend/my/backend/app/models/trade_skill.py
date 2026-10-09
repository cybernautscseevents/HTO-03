import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class SkillLevel(int, enum.Enum):
    BEGINNER = 1
    INTERMEDIATE = 2
    ADVANCED = 3
    EXPERT = 4

class VerificationStatus(str, enum.Enum):
    SELF_DECLARED = "SELF_DECLARED"
    CONTRACTOR_VERIFIED = "CONTRACTOR_VERIFIED"
    SUPERVISOR_VERIFIED = "SUPERVISOR_VERIFIED"
    WORK_VERIFIED = "WORK_VERIFIED"
    CERTIFIED = "CERTIFIED"

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    skills = relationship("Skill", back_populates="trade", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("trade_id", "name", name="uq_trade_skill_name"),
    )

    # Relationships
    trade = relationship("Trade", back_populates="skills")
    worker_skills = relationship("WorkerSkill", back_populates="skill", cascade="all, delete-orphan")

class WorkerSkill(Base):
    __tablename__ = "worker_skills"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_level = Column(Integer, default=SkillLevel.BEGINNER.value, nullable=False)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.SELF_DECLARED, nullable=False)
    verified_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    evidence_reference = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("worker_id", "skill_id", name="uq_worker_skill"),
    )

    # Relationships
    worker = relationship("Worker", back_populates="skills")
    skill = relationship("Skill", back_populates="worker_skills")
    verifier = relationship("User", foreign_keys=[verified_by])

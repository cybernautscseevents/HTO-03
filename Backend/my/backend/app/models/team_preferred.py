from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    contractor = relationship("Contractor", back_populates="teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="RESTRICT"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="RESTRICT"), nullable=True)
    minimum_skill_level = Column(Integer, default=1, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)

    # Relationships
    team = relationship("Team", back_populates="members")
    trade = relationship("Trade")
    skill = relationship("Skill")

class PreferredWorker(Base):
    __tablename__ = "preferred_workers"

    id = Column(Integer, primary_key=True, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("contractor_id", "worker_id", name="uq_contractor_preferred_worker"),
    )

    # Relationships
    contractor = relationship("Contractor", back_populates="preferred_workers")
    worker = relationship("Worker")

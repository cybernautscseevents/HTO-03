import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class IncidentType(str, enum.Enum):
    INJURY = "INJURY"
    NEAR_MISS = "NEAR_MISS"
    SAFETY_VIOLATION = "SAFETY_VIOLATION"
    EQUIPMENT_INCIDENT = "EQUIPMENT_INCIDENT"
    OTHER = "OTHER"

class IncidentStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="SET NULL"), nullable=True, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True, index=True)
    incident_type = Column(Enum(IncidentType), nullable=False, index=True)
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    witnesses = Column(Text, nullable=True)
    worker_statement = Column(Text, nullable=True)
    supervisor_statement = Column(Text, nullable=True)
    evidence_reference = Column(String(255), nullable=True)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.REPORTED, nullable=False, index=True)
    resolution = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    worker = relationship("Worker")
    contractor = relationship("Contractor")
    project = relationship("Project")
    site = relationship("Site")
    assignment = relationship("Assignment")
    resolver = relationship("User", foreign_keys=[resolved_by])

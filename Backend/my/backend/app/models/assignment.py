import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, Text, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REPLACED = "REPLACED"

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.ACTIVE, nullable=False, index=True)
    replacement_reason = Column(Text, nullable=True)
    replaced_by_assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    work_order = relationship("WorkOrder", back_populates="assignments")
    worker = relationship("Worker", back_populates="assignments")
    project = relationship("Project")
    site = relationship("Site")
    attendances = relationship("Attendance", back_populates="assignment")
    payment_records = relationship("PaymentRecord", back_populates="assignment")
    replaced_by = relationship("Assignment", remote_side=[id])

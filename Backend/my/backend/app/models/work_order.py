import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Date, DateTime, Boolean, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class WorkOrderStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    REVISED = "REVISED"
    COMPLETED = "COMPLETED"
    TERMINATED = "TERMINATED"

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    requirement_item_id = Column(Integer, ForeignKey("labour_requirement_items.id", ondelete="SET NULL"), nullable=True, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="RESTRICT"), nullable=False)
    role_title = Column(String(100), nullable=False)
    current_version_id = Column(Integer, nullable=True)  # References latest WorkOrderVersion.id
    status = Column(Enum(WorkOrderStatus), default=WorkOrderStatus.ACTIVE, nullable=False, index=True)
    acceptance_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    contractor = relationship("Contractor", back_populates="work_orders")
    worker = relationship("Worker")
    project = relationship("Project", back_populates="work_orders")
    site = relationship("Site", back_populates="work_orders")
    trade = relationship("Trade")
    requirement_item = relationship("LabourRequirementItem", back_populates="work_orders")
    versions = relationship("WorkOrderVersion", back_populates="work_order", cascade="all, delete-orphan", foreign_keys="WorkOrderVersion.work_order_id")
    assignments = relationship("Assignment", back_populates="work_order")

class WorkOrderVersion(Base):
    __tablename__ = "work_order_versions"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    agreed_wage_rate = Column(Float, nullable=False)
    wage_period = Column(String(20), default="DAILY", nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    working_schedule = Column(String(100), default="08:00-17:00", nullable=False)
    terms_text = Column(Text, nullable=True)
    changed_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    changed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    reason = Column(Text, nullable=False)
    worker_confirmed = Column(Boolean, default=False, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("work_order_id", "version_number", name="uq_work_order_version"),
    )

    # Relationships
    work_order = relationship("WorkOrder", back_populates="versions", foreign_keys=[work_order_id])
    modifier = relationship("User", foreign_keys=[changed_by])

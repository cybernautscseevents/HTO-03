import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Enum, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class RequirementStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"

class WagePeriod(str, enum.Enum):
    DAILY = "DAILY"
    HOURLY = "HOURLY"
    MONTHLY = "MONTHLY"

class ItemStatus(str, enum.Enum):
    OPEN = "OPEN"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"

class LabourRequirement(Base):
    __tablename__ = "labour_requirements"

    id = Column(Integer, primary_key=True, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    required_start_date = Column(Date, nullable=False)
    required_end_date = Column(Date, nullable=False)
    work_schedule = Column(String(100), default="08:00-17:00", nullable=False)
    status = Column(Enum(RequirementStatus), default=RequirementStatus.OPEN, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("required_end_date >= required_start_date", name="chk_req_dates"),
    )

    # Relationships
    contractor = relationship("Contractor", back_populates="labour_requirements")
    project = relationship("Project", back_populates="labour_requirements")
    site = relationship("Site", back_populates="labour_requirements")
    items = relationship("LabourRequirementItem", back_populates="requirement", cascade="all, delete-orphan")

class LabourRequirementItem(Base):
    __tablename__ = "labour_requirement_items"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("labour_requirements.id", ondelete="CASCADE"), nullable=False, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="RESTRICT"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False, index=True)
    minimum_skill_level = Column(Integer, nullable=False)
    quantity_required = Column(Integer, nullable=False)
    wage_rate = Column(Float, nullable=False)
    wage_period = Column(Enum(WagePeriod), default=WagePeriod.DAILY, nullable=False)
    duration = Column(String(80), nullable=True)
    schedule = Column(String(80), nullable=True)
    filled_quantity = Column(Integer, default=0, nullable=False)
    status = Column(Enum(ItemStatus), default=ItemStatus.OPEN, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity_required > 0", name="chk_item_qty_positive"),
        CheckConstraint("wage_rate >= 0", name="chk_item_wage_non_negative"),
        CheckConstraint("filled_quantity >= 0", name="chk_item_filled_non_negative"),
    )

    # Relationships
    requirement = relationship("LabourRequirement", back_populates="items")
    trade = relationship("Trade")
    skill = relationship("Skill")
    job_offers = relationship("JobOffer", back_populates="requirement_item")
    work_orders = relationship("WorkOrder", back_populates="requirement_item")

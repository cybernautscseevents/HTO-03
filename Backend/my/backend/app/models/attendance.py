import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, Date, DateTime, Boolean, Text, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    PENDING_CONFIRMATION = "PENDING_CONFIRMATION"
    DISPUTED = "DISPUTED"
    CANCELLED = "CANCELLED"

class ConfirmationMethod(str, enum.Enum):
    APP = "APP"
    IVR = "IVR"
    SMS = "SMS"
    SUPERVISOR = "SUPERVISOR"
    MANUAL = "MANUAL"
    SITE_DEVICE = "SITE_DEVICE"
    QR = "QR"

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    worker_confirmed = Column(Boolean, default=True, nullable=False)
    supervisor_confirmed = Column(Boolean, default=False, nullable=False)
    confirmed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    attendance_status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PENDING_CONFIRMATION, nullable=False, index=True)
    confirmation_method = Column(Enum(ConfirmationMethod), default=ConfirmationMethod.APP, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("assignment_id", "date", name="uq_assignment_date_attendance"),
    )

    # Relationships
    assignment = relationship("Assignment", back_populates="attendances")
    worker = relationship("Worker", back_populates="attendances")
    confirmer = relationship("User", foreign_keys=[confirmed_by])
    payment_records = relationship("PaymentRecord", back_populates="attendance")

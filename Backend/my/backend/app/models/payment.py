import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, Float, String, Text, Date, DateTime, Enum, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    REPORTED_PAID = "REPORTED_PAID"
    DISPUTED = "DISPUTED"
    RESOLVED = "RESOLVED"

class PaymentMethod(str, enum.Enum):
    UPI = "UPI"
    BANK_TRANSFER = "BANK_TRANSFER"
    CASH = "CASH"
    CHEQUE = "CHEQUE"
    OTHER = "OTHER"

class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    attendance_id = Column(Integer, ForeignKey("attendances.id", ondelete="SET NULL"), nullable=True, index=True)
    agreed_amount = Column(Float, nullable=False)
    amount_due = Column(Float, nullable=False)
    amount_reported_paid = Column(Float, default=0.0, nullable=False)
    payment_date = Column(Date, nullable=True, index=True)
    payment_method = Column(Enum(PaymentMethod), nullable=True)
    payment_reference = Column(String(100), nullable=True)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    supporting_evidence = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("agreed_amount >= 0", name="chk_pay_agreed_non_neg"),
        CheckConstraint("amount_due >= 0", name="chk_pay_due_non_neg"),
        CheckConstraint("amount_reported_paid >= 0", name="chk_pay_reported_non_neg"),
    )

    # Relationships
    worker = relationship("Worker", back_populates="payment_records")
    assignment = relationship("Assignment", back_populates="payment_records")
    attendance = relationship("Attendance", back_populates="payment_records")
    disputes = relationship("Dispute", back_populates="payment")

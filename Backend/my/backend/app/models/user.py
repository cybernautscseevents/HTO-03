import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    WORKER = "WORKER"
    CONTRACTOR = "CONTRACTOR"
    SUPERVISOR = "SUPERVISOR"
    ADMIN = "ADMIN"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(Enum(UserRole), nullable=False, index=True)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    phone_verified = Column(Boolean, default=False, nullable=False)
    name = Column(String(120), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    worker_profile = relationship("Worker", back_populates="user", uselist=False, cascade="all, delete-orphan")
    contractor_profile = relationship("Contractor", back_populates="user", uselist=False, cascade="all, delete-orphan")

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.user import UserRole, UserStatus

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    phone_number: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    role: UserRole

class UserLoginRequest(BaseModel):
    phone_number: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    name: str

class PhoneVerifyRequest(BaseModel):
    phone_number: str
    verification_code: str = "123456"  # Mock OTP for MVP

class UserResponse(BaseModel):
    id: int
    role: UserRole
    phone_number: str
    phone_verified: bool
    name: str
    status: UserStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[UserStatus] = None

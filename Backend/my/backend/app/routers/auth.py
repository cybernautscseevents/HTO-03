from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole, UserStatus
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, PhoneVerifyRequest, UserResponse, UserUpdateRequest
from app.schemas.common import StandardResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=StandardResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.phone_number == req.phone_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "PHONE_ALREADY_REGISTERED", "message": "Phone number already in use"}
        )

    user = User(
        name=req.name,
        phone_number=req.phone_number,
        hashed_password=get_password_hash(req.password),
        role=req.role,
        phone_verified=True,  # Auto-verified for demo convenience
        status=UserStatus.ACTIVE
    )
    db.add(user)
    db.flush()

    AuditService.log(
        db=db,
        actor_id=user.id,
        entity_type="USER",
        entity_id=user.id,
        action="USER_REGISTERED",
        new_value={"name": user.name, "role": user.role.value, "phone": user.phone_number},
        reason="New user registered"
    )
    db.commit()
    db.refresh(user)

    return StandardResponse(data=UserResponse.model_validate(user), message="User registered successfully")

@router.post("/login", response_model=StandardResponse[TokenResponse])
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone_number == req.phone_number).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid phone number or password"}
        )
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_SUSPENDED", "message": "User account is suspended"}
        )

    token = create_access_token(subject=user.id, role=user.role.value)
    return StandardResponse(
        data=TokenResponse(
            access_token=token,
            token_type="bearer",
            role=user.role,
            user_id=user.id,
            name=user.name
        ),
        message="Authentication successful"
    )

@router.post("/verify-phone", response_model=StandardResponse[dict])
def verify_phone(req: PhoneVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone_number == req.phone_number).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User with phone number not found")
    user.phone_verified = True
    db.commit()
    return StandardResponse(data={"phone_number": user.phone_number, "verified": True}, message="Phone verified successfully")

@router.get("/me", response_model=StandardResponse[UserResponse])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return StandardResponse(data=UserResponse.model_validate(current_user), message="Profile fetched successfully")

@router.patch("/me", response_model=StandardResponse[UserResponse])
def update_current_user_profile(req: UserUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.name:
        current_user.name = req.name
    if req.status:
        current_user.status = req.status
    db.commit()
    db.refresh(current_user)
    return StandardResponse(data=UserResponse.model_validate(current_user), message="Profile updated successfully")

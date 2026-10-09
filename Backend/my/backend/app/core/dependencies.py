from typing import List, Optional
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole, UserStatus
from app.models.worker import Worker
from app.models.contractor import Contractor
from app.utils.exceptions import UnauthorizedResource, ResourceNotFound

security_bearer = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NOT_AUTHENTICATED", "message": "Authentication token is required"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token is invalid or expired"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token payload missing user ID"},
        )
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID format in token")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is suspended")
    return user

def require_role(roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise UnauthorizedResource(f"Access denied: Requires role {', '.join([r.value for r in roles])}")
        return current_user
    return role_checker

def get_current_worker(
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
) -> Worker:
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise ResourceNotFound("Worker profile not found for this user")
    return worker

def get_current_contractor(
    current_user: User = Depends(require_role([UserRole.CONTRACTOR])),
    db: Session = Depends(get_db)
) -> Contractor:
    contractor = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
    if not contractor:
        raise ResourceNotFound("Contractor profile not found for this user")
    return contractor

def get_pagination(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page")
):
    return {"page": page, "page_size": page_size, "offset": (page - 1) * page_size}

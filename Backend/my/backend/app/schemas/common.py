from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel

T = TypeVar("T")

class PaginationInfo(BaseModel):
    page: int
    page_size: int
    total: int

class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: str = "Operation successful"

class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: List[T] = []
    pagination: PaginationInfo
    message: str = "Operation successful"

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail

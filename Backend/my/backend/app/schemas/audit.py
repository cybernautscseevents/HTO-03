from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    entity_type: str
    entity_id: int
    action: str
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    reason: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

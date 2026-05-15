from enum import Enum
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date

class AuditLogResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    changed_by_user_id: Optional[UUID]
    action: str
    old_value: Optional[str]
    new_value: Optional[str]
    notes: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

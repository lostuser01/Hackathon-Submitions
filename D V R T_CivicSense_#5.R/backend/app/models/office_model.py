from enum import Enum
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from app.models.enums_model import OfficeType

class OfficeBase(BaseModel):
    name: str
    type: OfficeType
    district: str
    address_text: Optional[str] = None
    phone_number: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    operating_hours: Optional[str] = None
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    is_active: bool = True

class OfficeCreate(OfficeBase):
    supported_department_ids: List[UUID] = []

class OfficeUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[OfficeType] = None
    district: Optional[str] = None
    address_text: Optional[str] = None
    phone_number: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    operating_hours: Optional[str] = None
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lon: Optional[float] = Field(None, ge=-180, le=180)
    is_active: Optional[bool] = None
    supported_department_ids: Optional[List[UUID]] = None

class OfficeResponse(OfficeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

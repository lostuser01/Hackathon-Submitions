from enum import Enum
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from app.models.enums_model import PriorityLevel, ComplaintStatus

class ComplaintBase(BaseModel):
    title: str
    description: str
    priority: PriorityLevel = PriorityLevel.medium
    image_url: Optional[str] = None
    lat: float
    lon: float
    address_text: Optional[str] = None
    landmark: Optional[str] = None
    is_public_visible: bool = True

class ComplaintCreate(ComplaintBase):
    """Payload sent by the Citizen's mobile app"""
    # citizen_id is usually inferred from the JWT token in the API route, 
    # but included here if passed explicitly
    citizen_id: UUID 

class ComplaintUpdate(BaseModel):
    """Used primarily by Workers, Supervisors, and the AI routing engine"""
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PriorityLevel] = None
    image_url: Optional[str] = None
    is_public_visible: Optional[bool] = None
    
    status: Optional[ComplaintStatus] = None
    department_id: Optional[UUID] = None
    office_id: Optional[UUID] = None
    assigned_worker_id: Optional[UUID] = None
    
    resolution_image_url: Optional[str] = None
    resolution_notes: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    id: UUID
    citizen_id: UUID
    status: ComplaintStatus
    department_id: Optional[UUID]
    office_id: Optional[UUID]
    assigned_worker_id: Optional[UUID]
    resolution_image_url: Optional[str]
    resolution_notes: Optional[str]
    
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

class ComplaintResolve(BaseModel):
    resolution_notes: str
    resolution_image_url: Optional[str] = None

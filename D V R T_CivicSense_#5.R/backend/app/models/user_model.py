from datetime import date, datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from app.models.enums_model import UserRole
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProfileBase(BaseModel):
    role: UserRole = UserRole.citizen
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    date_of_birth: Optional[date] = None

    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    assigned_office_id: Optional[UUID] = None
    assigned_department_id: Optional[UUID] = None
    is_active: bool = True


class ProfileCreate(ProfileBase):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    date_of_birth: Optional[date] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    is_active: Optional[bool] = None

    # Only Managers/Admins should be allowed to update these via a protected endpoint
    role: Optional[UserRole] = None
    assigned_office_id: Optional[UUID] = None
    assigned_department_id: Optional[UUID] = None


class ProfileResponse(ProfileBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: Optional[UserRole] = UserRole.citizen
    phone_number: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    assigned_department_id: Optional[UUID] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    role: UserRole
    assigned_office_id: Optional[UUID] = None
    assigned_department_id: Optional[UUID] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CreateStaffRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: UserRole  # manager or worker
    assigned_office_id: UUID
    assigned_department_id: Optional[UUID] = None

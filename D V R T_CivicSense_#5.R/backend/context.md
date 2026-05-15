### PROJECT STRUCTURE
.
├── app
│  ├── api
│  │  ├── audit_log.py
│  │  ├── complaint.py
│  │  ├── department.py
│  │  ├── office.py
│  │  ├── profile.py
│  │  └── user.py
│  ├── config.py
│  ├── models
│  │  ├── audit_log_model.py
│  │  ├── complaint_model.py
│  │  ├── department_model.py
│  │  ├── enums_model.py
│  │  ├── office_model.py
│  │  └── user_model.py
│  ├── README.md
│  ├── services
│  │  ├── ai_service.py
│  │  ├── auth.py
│  │  ├── db_supabase.py
│  │  └── jwt_test.py
│  └── utilities
│     ├── api_test.py
│     └── seed.py
├── context.md
├── main.py
├── requirements.txt
└── scratch
   └── check_db.py

### SOURCE CODE

-- FILE: ./app/services/jwt_test.py --

# test_login.py
import os
from app.config import env
from supabase import create_client

s = create_client(env.SUPABASE_URL, env.SUPABASE_KEY)

# Use the email/password of the user you registered in the Supabase Auth Dashboard
response = s.auth.sign_in_with_password({
    "email": "test@gmail.com",
    "password": "123456789"
})

print("Copy this massive string into Postman/Swagger:")
print(response.session.access_token)

-- FILE: ./app/services/ai_service.py --

import logging
from supabase import Client
from fastembed import TextEmbedding

# Initialize model once
embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

async def process_new_complaint_ai(
    complaint_id: str, 
    title: str, 
    description: str, 
    lat: float, 
    lon: float, 
    db: Client
):
    try:
        # 1. Generate Vector
        text_to_embed = f"{title}. {description}"
        vectors = list(embedding_model.embed([text_to_embed]))
        embedding_list = vectors[0].tolist()

        # 2. Store Vector for future similarity searches
        db.table("complaint_embeddings").upsert({
            "complaint_id": complaint_id,
            "embedding": embedding_list,
            "model_version": "fastembed-bge-small-en"
        }).execute()

        # 3. Semantic Routing: Find best Department
        # Calls the predict_department RPC in Supabase
        predict_res = db.rpc("predict_department", {
            "query_embedding": embedding_list, 
            "match_limit": 3
        }).execute()

        if predict_res.data and predict_res.data[0]["confidence_score"] > 0.60:
            dept_id = predict_res.data[0]["predicted_department_id"]
            
            # 4. Spatial Routing: Find closest Office for that Dept
            office_res = db.rpc("get_closest_office", {
                "query_lat": lat, 
                "query_lon": lon, 
                "target_department_id": dept_id
            }).execute()
            
            assigned_office_id = office_res.data if office_res.data else None

            # 5. Update Record
            db.table("complaints").update({
                "department_id": dept_id,
                "office_id": assigned_office_id,
                "status": "routed"
            }).eq("id", complaint_id).execute()
            
            logging.info(f"Complaint {complaint_id} auto-routed to Dept {dept_id}")

    except Exception as e:
        logging.error(f"AI Routing Error for {complaint_id}: {str(e)}")

-- FILE: ./app/services/auth.py --

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import env
from app.services.db_supabase import get_db
from app.models.user_model import ProfileResponse

security = HTTPBearer()

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security), db = Depends(get_db)):
    try:
        # Supabase JWTs use the 'authenticated' audience
        payload = jwt.decode(
            token.credentials, env.JWT_SECRET, algorithms=["HS256"],
            options={"verify_aud": True}, audience="authenticated"
        )
        
        user_id = payload.get("sub")
        if not user_id: raise HTTPException(status_code=401, detail="Invalid Token")

        res = db.table("profiles").select("*").eq("id", user_id).single().execute()
        if not res.data: raise HTTPException(status_code=401, detail="Profile not found")
        
        return ProfileResponse(**res.data)

    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")

def check_office_match(user: ProfileResponse, office_id: str):
    if user.role == "admin": return True
    if str(user.assigned_office_id) != str(office_id):
        raise HTTPException(status_code=403, detail="Office mismatch")
    return True

-- FILE: ./app/services/db_supabase.py --

from supabase import create_client, Client
from app.config import env

def get_db() -> Client:
    if not env.SUPABASE_KEY or not env.SUPABASE_URL:
        raise ValueError("Supabase credentials not found in environment variables.")
    return create_client(env.SUPABASE_URL, env.SUPABASE_KEY)


-- FILE: ./app/config.py --

from dotenv import load_dotenv
from os import getenv 

load_dotenv()

class Config:
    SUPABASE_URL = getenv("SUPABASE_URL")
    SUPABASE_KEY = getenv("SUPABASE_KEY")
    JWT_SECRET = getenv("JWT_SECRET")
    JWT_EXPIRE_DAYS = getenv("JWT_EXPIRE_DAYS")
    FRONTEND_URL = getenv("FRONTEND_URL")

env = Config()

-- FILE: ./app/models/audit_log_model.py --

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

-- FILE: ./app/models/enums_model.py --

from enum import Enum
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date

# ==========================================
# ENUMS
# ==========================================
class UserRole(str, Enum):
    citizen = 'citizen'
    worker = 'worker'
    supervisor = 'supervisor'
    manager = 'manager'
    admin = 'admin'

class ComplaintStatus(str, Enum):
    pending_routing = 'pending_routing'
    routed = 'routed'
    in_progress = 'in_progress'
    resolved = 'resolved'
    rejected = 'rejected'
    re_routed = 're_routed'

class OfficeType(str, Enum):
    municipal_corp = 'municipal_corp'
    municipal_council = 'municipal_council'
    panchayat = 'panchayat'
    state_dept = 'state_dept'
    sub_station = 'sub_station'

class PriorityLevel(str, Enum):
    low = 'low'
    medium = 'medium'
    high = 'high'
    critical = 'critical'

-- FILE: ./app/models/office_model.py --

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

-- FILE: ./app/models/user_model.py --

from enum import Enum
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from app.models.enums_model import UserRole


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
    phone_number: Optional[str] = None

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
    role: UserRole # manager or worker
    assigned_office_id: UUID
    assigned_department_id: Optional[UUID] = None
-- FILE: ./app/models/complaint_model.py --

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

-- FILE: ./app/models/department_model.py --

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class DepartmentBase(BaseModel):
    code: str = Field(..., description="Unique shorthand, e.g., SWM")
    name: str = Field(..., description="Full department name")
    description: Optional[str] = None
    is_active: bool = True

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class DepartmentResponse(DepartmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

-- FILE: ./app/utilities/api_test.py --

import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
from unittest.mock import MagicMock
from datetime import datetime, timezone

# Adjust these imports to match your actual project structure
from main import app 
from app.services.db_supabase import get_db 

# ==========================================
# MOCK DATABASE SETUP
# ==========================================
# We create a fake Supabase client so we don't hit the real database
mock_db = MagicMock()

def override_get_db():
    return mock_db

# Tell FastAPI to use our mock instead of the real database connection
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Some dummy data for testing
DUMMY_UUID = str(uuid4())
CITIZEN_UUID = str(uuid4())
CURRENT_TIME = datetime.now(timezone.utc).isoformat()

# ==========================================
# 1. HEALTH CHECK TEST
# ==========================================
def test_health_check():
    response = client.get("/")
    assert response.status_code == 200

# ==========================================
# 2. DEPARTMENT TESTS
# ==========================================
def test_create_department():
    # Setup mock response
    mock_response = MagicMock()
    mock_response.data = [{
        "id": DUMMY_UUID,
        "code": "SWM",
        "name": "Solid Waste Management",
        "description": "Garbage and sweeping",
        "is_active": True,
        "created_at": CURRENT_TIME,
        "updated_at": CURRENT_TIME
    }]
    mock_db.table().insert().execute.return_value = mock_response

    # Send Request
    payload = {
        "code": "SWM",
        "name": "Solid Waste Management",
        "description": "Garbage and sweeping"
    }
    response = client.post("/departments/", json=payload)

    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "SWM"
    assert data["id"] == DUMMY_UUID

def test_get_departments():
    # Setup mock response
    mock_response = MagicMock()
    mock_response.data = [
        {"id": DUMMY_UUID, "code": "PWD", "name": "Public Works", "is_active": True, "created_at": CURRENT_TIME, "updated_at": CURRENT_TIME}
    ]
    mock_db.table().select().execute.return_value = mock_response

    response = client.get("/departments/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 1

# ==========================================
# 3. OFFICE TESTS
# ==========================================
def test_create_office_validation_error():
    # Missing required 'type', 'lat', 'lon' fields should trigger Pydantic 422
    payload = {
        "name": "Panaji HQ",
        "district": "North Goa"
    }
    response = client.post("/offices/", json=payload)
    assert response.status_code == 422
    assert "detail" in response.json()

def test_create_office_success():
    mock_response = MagicMock()
    mock_response.data = [{
        "id": DUMMY_UUID,
        "name": "Panaji HQ",
        "type": "state_dept",
        "district": "North Goa",
        "lat": 15.49,
        "lon": 73.82,
        "address_text": None,
        "phone_number": None,
        "contact_email": None,
        "operating_hours": None,
        "is_active": True,
        "created_at": CURRENT_TIME,
        "updated_at": CURRENT_TIME
    }]
    mock_db.table().insert().execute.return_value = mock_response

    payload = {
        "name": "Panaji HQ",
        "type": "state_dept",
        "district": "North Goa",
        "lat": 15.49,
        "lon": 73.82
    }
    response = client.post("/offices/", json=payload)
    assert response.status_code == 200
    assert response.json()["type"] == "state_dept"

# ==========================================
# 4. COMPLAINT TESTS
# ==========================================
def test_create_complaint():
    mock_response = MagicMock()
    mock_response.data = [{
        "id": DUMMY_UUID,
        "citizen_id": CITIZEN_UUID,
        "title": "Huge Pothole",
        "description": "Damaging cars on the main road",
        "priority": "high",
        "status": "pending_routing",
        "lat": 15.4,
        "lon": 74.0,
        "is_public_visible": True,
        "image_url": None,
        "address_text": None,
        "landmark": None,
        "department_id": None,
        "office_id": None,
        "assigned_worker_id": None,
        "resolution_image_url": None,
        "resolution_notes": None,
        "created_at": CURRENT_TIME,
        "updated_at": CURRENT_TIME,
        "resolved_at": None
    }]
    mock_db.table().insert().execute.return_value = mock_response

    payload = {
        "title": "Huge Pothole",
        "description": "Damaging cars on the main road",
        "priority": "high",
        "lat": 15.4,
        "lon": 74.0,
        "citizen_id": CITIZEN_UUID
    }
    
    response = client.post("/complaints/", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Huge Pothole"
    assert data["status"] == "pending_routing"
    assert data["priority"] == "high"

def test_update_complaint_status():
    mock_old_res = MagicMock()
    mock_old_res.data = [{"status": "pending_routing"}]
    
    mock_new_res = MagicMock()
    mock_new_res.data = [{
        "id": DUMMY_UUID,
        "citizen_id": CITIZEN_UUID,
        "title": "Huge Pothole",
        "description": "Damaging cars on the main road",
        "priority": "high",
        "status": "in_progress", # Status changed here
        "lat": 15.4, "lon": 74.0, "is_public_visible": True, "image_url": None, "address_text": None, "landmark": None, "department_id": None, "office_id": None, "assigned_worker_id": None, "resolution_image_url": None, "resolution_notes": None, "created_at": CURRENT_TIME, "updated_at": CURRENT_TIME, "resolved_at": None
    }]
    
    # We have to use side_effect to return different mocks for different queries 
    # (first the old record fetch, then the update fetch)
    mock_db.table().select().eq().execute.return_value = mock_old_res
    mock_db.table().update().eq().execute.return_value = mock_new_res

    # Note: Our schema requires `updater_id` as a query parameter in the patch URL
    updater_uuid = str(uuid4())
    payload = {"status": "in_progress"}
    
    response = client.patch(f"/complaints/{DUMMY_UUID}?updater_id={updater_uuid}", json=payload)
    
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"

-- FILE: ./app/utilities/seed.py --

from uuid import uuid4
from supabase import create_client, Client
from fastembed import TextEmbedding


from dotenv import load_dotenv
from os import getenv 

load_dotenv()

SUPABASE_URL = getenv("SUPABASE_URL")
SUPABASE_KEY = getenv("SUPABASE_KEY")



# ==========================================
# CONFIGURATION
# ==========================================
# Replace this with a valid UUID from your Supabase auth.users table!
CITIZEN_ID = "ad854557-db08-41b6-aa03-b5c4727e6e4c" 


if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in environment.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# ==========================================
# 1. DEPARTMENT SEED DATA
# ==========================================
DEPARTMENTS = [
    {"code": "SWM", "name": "Solid Waste Management", "description": "Garbage, dumping, sweeping."},
    {"code": "WATER", "name": "Water Supply", "description": "Drinking water, pipelines, pressure."},
    {"code": "DRAIN", "name": "Drainage & Sewerage", "description": "Sewage, gutters, manholes."},
    {"code": "PWD", "name": "Public Works Department", "description": "Roads, potholes, footpaths."},
    {"code": "ELEC", "name": "Electrical Department", "description": "Streetlights, wires, poles."},
    {"code": "HEALTH", "name": "Health & Sanitation", "description": "Mosquitoes, dead animals, pests."}
]

# Helper map to link the CSV strings to our exact Department Codes
CSV_DEPT_MAP = {
    "Solid Waste": "SWM",
    "Health": "HEALTH",
    "Roads_Internal": "PWD",
    "Roads_Major": "PWD",
    "Drainage": "DRAIN",
    "Water Supply": "WATER",
    "Electrical": "ELEC",
    "Streetlights": "ELEC"
    # Note: Encroachment is ignored here as it wasn't in the top 6 core list
}

# ==========================================
# 2. OFFICE SEED DATA (From your CSV)
# ==========================================
RAW_OFFICES = [
    {"name": "Corporation of the City of Panaji (CCP)", "type": "municipal_corp", "district": "North Goa", "lat": 15.4909, "lon": 73.8278, "depts": "Solid Waste|Health|Roads_Internal|Encroachment|Drainage"},
    {"name": "Margao Municipal Council", "type": "municipal_council", "district": "South Goa", "lat": 15.2736, "lon": 73.9581, "depts": "Solid Waste|Health|Roads_Internal|Encroachment|Drainage"},
    {"name": "Mapusa Municipal Council", "type": "municipal_council", "district": "North Goa", "lat": 15.5925, "lon": 73.8143, "depts": "Solid Waste|Health|Roads_Internal|Encroachment|Drainage"},
    {"name": "Mormugao Municipal Council (Vasco)", "type": "municipal_council", "district": "South Goa", "lat": 15.3960, "lon": 73.8113, "depts": "Solid Waste|Health|Roads_Internal|Encroachment|Drainage"},
    {"name": "Ponda Municipal Council", "type": "municipal_council", "district": "South Goa", "lat": 15.3992, "lon": 74.0131, "depts": "Solid Waste|Health|Roads_Internal|Encroachment|Drainage"},
    {"name": "Bicholim Municipal Council", "type": "municipal_council", "district": "North Goa", "lat": 15.5947, "lon": 73.9507, "depts": "Solid Waste|Health|Roads_Internal|Encroachment"},
    {"name": "Canacona Municipal Council", "type": "municipal_council", "district": "South Goa", "lat": 15.0150, "lon": 74.0200, "depts": "Solid Waste|Health|Roads_Internal|Encroachment"},
    {"name": "Quepem Municipal Council", "type": "municipal_council", "district": "South Goa", "lat": 15.2150, "lon": 74.0410, "depts": "Solid Waste|Health|Roads_Internal|Encroachment"},
    {"name": "Cuncolim Municipal Council", "type": "municipal_council", "district": "South Goa", "lat": 15.1950, "lon": 73.9840, "depts": "Solid Waste|Health|Roads_Internal|Encroachment"},
    {"name": "PWD Works Division I (Panaji)", "type": "state_dept", "district": "North Goa", "lat": 15.4950, "lon": 73.8250, "depts": "Water Supply|Roads_Major"},
    {"name": "PWD Works Division VI (Margao)", "type": "state_dept", "district": "South Goa", "lat": 15.2780, "lon": 73.9600, "depts": "Water Supply|Roads_Major"},
    {"name": "PWD Works Division XVII (Mapusa)", "type": "state_dept", "district": "North Goa", "lat": 15.5950, "lon": 73.8150, "depts": "Water Supply|Roads_Major"},
    {"name": "PWD Works Division XXI (Ponda)", "type": "state_dept", "district": "South Goa", "lat": 15.4021, "lon": 74.0145, "depts": "Water Supply|Roads_Major"},
    {"name": "Goa Electricity Dept (Panaji HQ)", "type": "state_dept", "district": "North Goa", "lat": 15.4910, "lon": 73.8300, "depts": "Electrical|Streetlights"},
    {"name": "Goa Electricity Dept (Margao Div)", "type": "state_dept", "district": "South Goa", "lat": 15.2800, "lon": 73.9550, "depts": "Electrical|Streetlights"},
    {"name": "Goa Electricity Dept (Ponda Div)", "type": "state_dept", "district": "South Goa", "lat": 15.4015, "lon": 74.0180, "depts": "Electrical|Streetlights"},
    {"name": "Calangute Village Panchayat", "type": "panchayat", "district": "North Goa", "lat": 15.5410, "lon": 73.7620, "depts": "Solid Waste|Health|Roads_Internal"},
    {"name": "Saligao Village Panchayat", "type": "panchayat", "district": "North Goa", "lat": 15.5460, "lon": 73.7840, "depts": "Solid Waste|Health|Roads_Internal"},
    {"name": "Navelim Village Panchayat", "type": "panchayat", "district": "South Goa", "lat": 15.2500, "lon": 73.9500, "depts": "Solid Waste|Health|Roads_Internal"},
    {"name": "Colva Village Panchayat", "type": "panchayat", "district": "South Goa", "lat": 15.2750, "lon": 73.9160, "depts": "Solid Waste|Health|Roads_Internal"},
    {"name": "Bandora Village Panchayat", "type": "panchayat", "district": "South Goa", "lat": 15.4145, "lon": 73.9850, "depts": "Solid Waste|Health|Roads_Internal"},
    {"name": "Curti-Khandepar Village Panchayat", "type": "panchayat", "district": "South Goa", "lat": 15.4110, "lon": 74.0250, "depts": "Solid Waste|Health|Roads_Internal"},
    {"name": "Anjuna-Caisua Village Panchayat", "type": "panchayat", "district": "North Goa", "lat": 15.5830, "lon": 73.7430, "depts": "Solid Waste|Health|Roads_Internal"},
    {"name": "Taleigao Village Panchayat", "type": "panchayat", "district": "North Goa", "lat": 15.4630, "lon": 73.8120, "depts": "Solid Waste|Health|Roads_Internal"},
    {"name": "Raia Village Panchayat", "type": "panchayat", "district": "South Goa", "lat": 15.2950, "lon": 73.9920, "depts": "Solid Waste|Health|Roads_Internal"}
]

# ==========================================
# 3. HISTORICAL COMPLAINT SEED DATA (For AI Training)
# ==========================================
HISTORICAL_COMPLAINTS = [
    # SWM
    {"title": "Garbage not collected", "desc": "Irregular garbage collection for 3 days. Trash bin overflowing.", "code": "SWM"},
    {"title": "Burning plastic smell", "desc": "Someone is illegally burning waste and debris near the road. Horrible smell.", "code": "SWM"},
    {"title": "Street sweeping needed", "desc": "The street hasn't been swept in a week. Debris and trash everywhere.", "code": "SWM"},
    {"title": "Public dump", "desc": "People are using the corner as a public dump. Massive pile of garbage.", "code": "SWM"},
    # WATER
    {"title": "No drinking water", "desc": "Taps are dry since morning. No water supply to our colony.", "code": "WATER"},
    {"title": "Muddy tap water", "desc": "The drinking water is contaminated and looks completely muddy.", "code": "WATER"},
    {"title": "Pipeline burst", "desc": "Fresh water distribution pipeline burst on the main road, wasting water.", "code": "WATER"},
    {"title": "Low pressure", "desc": "Water pressure is too low to reach the overhead tank. Timing is also erratic.", "code": "WATER"},
    # DRAIN
    {"title": "Overflowing gutter", "desc": "Sewage water is overflowing from the choked drainage lines onto the road.", "code": "DRAIN"},
    {"title": "Missing manhole cover", "desc": "Dangerous open manhole in the middle of the street. Smells like sewage.", "code": "DRAIN"},
    {"title": "Storm water block", "desc": "Storm-water drain is completely blocked with plastic, causing water logging.", "code": "DRAIN"},
    {"title": "Terrible stench", "desc": "Drainage pipe seems broken underground, the stench of sewage is unbearable.", "code": "DRAIN"},
    # PWD
    {"title": "Massive pothole", "desc": "Huge crater on the road causing traffic blocks and damaging cars.", "code": "PWD"},
    {"title": "Broken pavement", "desc": "The footpath is completely destroyed, pedestrians have to walk on the road.", "code": "PWD"},
    {"title": "Damaged divider", "desc": "Road divider was hit by a truck and the debris is blocking the lane.", "code": "PWD"},
    {"title": "Need speed breaker", "desc": "Vehicles speeding dangerously. We need a speed breaker here.", "code": "PWD"},
    # ELEC
    {"title": "Streetlights dark", "desc": "Entire stretch of road is dark. Non-functioning streetlights for a week.", "code": "ELEC"},
    {"title": "Exposed wire hazard", "desc": "Dangerous electric wire hanging off a public pole near the school.", "code": "ELEC"},
    {"title": "Lights on in daytime", "desc": "Streetlights are left on during the day wasting electricity.", "code": "ELEC"},
    {"title": "Leaning pole", "desc": "Electric pole looks like it is about to fall over after the storm.", "code": "ELEC"},
    # HEALTH
    {"title": "Mosquito breeding", "desc": "Water stagnant in the empty plot. Severe mosquito menace, need fogging.", "code": "HEALTH"},
    {"title": "Stray dog pack", "desc": "Aggressive stray dogs chasing bikes. Please send animal control.", "code": "HEALTH"},
    {"title": "Dead animal on road", "desc": "Carcass of a dead stray dog rotting on the street, needs removal.", "code": "HEALTH"},
    {"title": "Public toilet condition", "desc": "Public toilet is completely unsanitary and filled with pests.", "code": "HEALTH"},
]

def main():
    print("🚀 Starting Database Seed Process...")

    # --- 1. INSERT DEPARTMENTS ---
    print("\n📦 Inserting Departments...")
    dept_res = supabase.table("departments").insert(DEPARTMENTS).execute()
    
    # Map department codes to generated UUIDs
    dept_uuid_map = {d["code"]: d["id"] for d in dept_res.data}
    print(f"✅ Inserted {len(dept_res.data)} Departments.")

    # --- 2. INSERT OFFICES & JUNCTIONS ---
    print("\n🏢 Inserting Offices and Mappings...")
    office_inserts = []
    for off in RAW_OFFICES:
        office_inserts.append({
            "name": off["name"], "type": off["type"], "district": off["district"],
            "lat": off["lat"], "lon": off["lon"]
        })
    
    off_res = supabase.table("offices").insert(office_inserts).execute()
    print(f"✅ Inserted {len(off_res.data)} Offices.")

    # Build the junction records based on the CSV pipes
    junction_inserts = []
    for i, office_record in enumerate(off_res.data):
        raw_depts = RAW_OFFICES[i]["depts"].split("|")
        for raw_dept in raw_depts:
            mapped_code = CSV_DEPT_MAP.get(raw_dept)
            if mapped_code and mapped_code in dept_uuid_map:
                junction_inserts.append({
                    "office_id": office_record["id"],
                    "department_id": dept_uuid_map[mapped_code]
                })

    # Drop duplicates just in case (e.g. Roads_Internal and Roads_Major mapping to PWD)
    unique_junctions = [dict(t) for t in {tuple(d.items()) for d in junction_inserts}]
    supabase.table("office_departments").insert(unique_junctions).execute()
    print(f"✅ Inserted {len(unique_junctions)} Office-Department Mappings.")

    # --- 3. INSERT COMPLAINTS & EMBEDDINGS ---
    print("\n🧠 Generating AI Embeddings and Inserting Complaints...")
    
    # Check if citizen profile exists, if not, attempt to create it
    # (Assuming auth.users has this ID already)
    try:
        supabase.table("profiles").insert({
            "id": CITIZEN_ID, "first_name": "System", "last_name": "Seeder", "role": "citizen"
        }).execute()
    except Exception:
        pass # Profile might already exist, which is fine.

    complaint_inserts = []
    for idx, hc in enumerate(HISTORICAL_COMPLAINTS):
        complaint_inserts.append({
            "citizen_id": CITIZEN_ID,
            "title": hc["title"],
            "description": hc["desc"],
            "status": "resolved", # Set as resolved so they act as reliable training data
            "department_id": dept_uuid_map[hc["code"]],
            # Assigning a generic central Goa coordinate for the seed data
            "lat": 15.4000 + (idx * 0.001), 
            "lon": 74.0000 + (idx * 0.001)
        })

    comp_res = supabase.table("complaints").insert(complaint_inserts).execute()
    
    # Generate vectors locally
    texts_to_embed = [f"{c['title']}. {c['desc']}" for c in HISTORICAL_COMPLAINTS]
    vectors = list(embedding_model.embed(texts_to_embed))
    
    embedding_inserts = []
    for i, db_record in enumerate(comp_res.data):
        embedding_inserts.append({
            "complaint_id": db_record["id"],
            "embedding": vectors[i].tolist(),
            "model_version": "fastembed-bge-small-en"
        })
        
    supabase.table("complaint_embeddings").insert(embedding_inserts).execute()
    print(f"✅ Generated and Inserted {len(embedding_inserts)} Complaint Vector Embeddings.")

    print("\n🎉 Seeding Complete! The Semantic Search Brain is now active.")

if __name__ == "__main__":
    main()

-- FILE: ./app/api/profile.py --

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from supabase import Client

from app.models.user_model import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services.db_supabase import get_db
from app.services.auth import get_current_user

router = APIRouter(prefix="/profiles", tags=["Profiles"])

@router.post("/", response_model=ProfileResponse)
def create_profile(
    profile: ProfileCreate, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create profiles directly")
        
    payload = profile.model_dump(exclude={"email", "password"})
    response = db.table("profiles").insert(payload).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create profile")
    return response.data[0]

@router.get("/", response_model=List[ProfileResponse])
def get_all_profiles(
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    query = db.table("profiles").select("*")
    
    if current_user.role in ["manager", "worker", "supervisor"]:
        if current_user.assigned_office_id:
            # Staff only sees others in the same office
            query = query.eq("assigned_office_id", str(current_user.assigned_office_id))
        else:
            # If no office is assigned, they see nothing
            return []
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
        
    response = query.execute()
    return response.data

@router.get("/me", response_model=ProfileResponse)
def get_my_profile(current_user: ProfileResponse = Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=ProfileResponse)
def get_profile(
    user_id: UUID, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    if current_user.role not in ["admin", "manager"] and str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Access denied")
        
    response = db.table("profiles").select("*").eq("id", str(user_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return response.data[0]

@router.patch("/{user_id}", response_model=ProfileResponse)
def update_profile(
    user_id: UUID, 
    profile_update: ProfileUpdate, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    # Only self or admin can update
    if current_user.role != "admin" and str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Access denied")
        
    payload = profile_update.model_dump(exclude_unset=True)
    
    # Restrict role/office updates to admins
    if current_user.role != "admin":
        payload.pop("role", None)
        payload.pop("assigned_office_id", None)
        payload.pop("assigned_department_id", None)

    response = db.table("profiles").update(payload).eq("id", str(user_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return response.data[0]

@router.delete("/{user_id}")
def delete_profile(
    user_id: UUID, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
        
    response = db.table("profiles").delete().eq("id", str(user_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Profile deleted successfully"}


-- FILE: ./app/api/user.py --

from fastapi import APIRouter, Depends, HTTPException
from app.models.user_model import SignupRequest, LoginRequest, AuthResponse
from app.services.db_supabase import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, db = Depends(get_db)):
    res = db.auth.sign_up({
        "email": payload.email, "password": payload.password,
        "options": {"data": {"first_name": payload.first_name, "last_name": payload.last_name, "role": "citizen"}}
    })
    if not res.user: raise HTTPException(status_code=400, detail="Signup failed")
    return {"access_token": res.session.access_token, "user": {"id": res.user.id, "email": payload.email, "role": "citizen", "first_name": payload.first_name, "last_name": payload.last_name}}

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db = Depends(get_db)):
    try:
        res = db.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
        profile = db.table("profiles").select("*").eq("id", res.user.id).single().execute()
        return {"access_token": res.session.access_token, "user": profile.data}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")

-- FILE: ./app/api/department.py --

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from supabase import Client

from app.models.department_model import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.models.user_model import ProfileResponse
from app.services.db_supabase import get_db
from app.services.auth import get_current_user

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.post("/", response_model=DepartmentResponse)
def create_department(
    dept: DepartmentCreate, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
        
    response = db.table("departments").insert(dept.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create department")
    return response.data[0]

@router.get("/", response_model=List[DepartmentResponse])
def get_departments(
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    response = db.table("departments").select("*").execute()
    return response.data

@router.patch("/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: UUID, 
    dept: DepartmentUpdate, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
        
    update_data = dept.model_dump(exclude_unset=True)
    response = db.table("departments").update(update_data).eq("id", str(dept_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Department not found")
    return response.data[0]

@router.delete("/{dept_id}")
def delete_department(
    dept_id: UUID, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
        
    response = db.table("departments").delete().eq("id", str(dept_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"message": "Department deleted successfully"}


-- FILE: ./app/api/complaint.py --

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from uuid import UUID
from supabase import Client
from fastembed import TextEmbedding
from datetime import datetime, timezone

from app.models.complaint_model import (
    ComplaintCreate, 
    ComplaintUpdate, 
    ComplaintResponse, 
    ComplaintResolve
)
from app.models.audit_log_model import AuditLogResponse
from app.models.user_model import ProfileResponse
from app.services.db_supabase import get_db
from app.services.auth import get_current_user, check_office_match

router = APIRouter(prefix="/complaints", tags=["Complaints"])

# Initialize the embedding model globally
embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# ==========================================
# BACKGROUND TASKS (AI Routing & Vector Storage)
# ==========================================

async def process_ai_pipeline(
    complaint_id: str, 
    title: str, 
    description: str, 
    lat: float, 
    lon: float, 
    embedding: List[float], 
    db: Client
):
    """
    Handles background processing for vector storage and automated routing.
    """
    try:
        # 1. Save the embedding to the vector store
        db.table("complaint_embeddings").upsert({
            "complaint_id": complaint_id,
            "embedding": embedding,
            "model_version": "fastembed-bge-small-en"
        }).execute()

        # 2. Predict Department via Semantic Similarity (RPC)
        rpc_response = db.rpc("predict_department", {
            "query_embedding": embedding, 
            "match_limit": 5
        }).execute()

        if rpc_response.data and len(rpc_response.data) > 0:
            prediction = rpc_response.data[0]
            
            # Confidence threshold of 60%
            if prediction.get("confidence_score", 0) > 0.60:
                predicted_dept_id = prediction["predicted_department_id"]
                
                # 3. Find the closest office for the predicted department
                closest_office_res = db.rpc("get_closest_office", {
                    "query_lat": lat,
                    "query_lon": lon,
                    "target_department_id": predicted_dept_id
                }).execute()
                
                assigned_office_id = closest_office_res.data if closest_office_res.data else None
                
                # 4. Update the complaint with routed info
                db.table("complaints").update({
                    "department_id": predicted_dept_id,
                    "office_id": assigned_office_id,
                    "status": "routed"
                }).eq("id", complaint_id).execute()

    except Exception as e:
        print(f"Background AI Pipeline Failed for {complaint_id}: {e}")


# ==========================================
# API ROUTES
# ==========================================

@router.post("/", response_model=ComplaintResponse)
async def create_complaint(
    complaint: ComplaintCreate, 
    background_tasks: BackgroundTasks,
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    # 1. Generate the Vector Embedding (Sync for duplicate check)
    text_to_embed = f"{complaint.title}. {complaint.description}"
    vectors = list(embedding_model.embed([text_to_embed]))
    embedding_list = vectors[0].tolist() 
    
    # 2. Check for Duplicates via Vector Proximity (RPC)
    try:
        rpc_response = db.rpc("find_duplicate_complaint", {
            "query_lat": complaint.lat,
            "query_lon": complaint.lon,
            "query_embedding": embedding_list,
            "radius_meters": 50.0,
            "similarity_threshold": 0.85 
        }).execute()
        
        duplicate_id = rpc_response.data
        if duplicate_id:
            # Citizen upvotes existing issue instead of creating a new one
            db.table("complaint_upvotes").upsert({
                "complaint_id": duplicate_id,
                "citizen_id": str(current_user.id)
            }, on_conflict="complaint_id, citizen_id").execute()
            
            existing_res = db.table("complaints").select("*").eq("id", duplicate_id).single().execute()
            return existing_res.data
            
    except Exception as e:
        print(f"Duplicate check failed: {e}")

    # 3. Create Record
    complaint_data = complaint.model_dump(mode='json')
    complaint_data["citizen_id"] = str(current_user.id)
    complaint_data["status"] = "pending_routing"

    res = db.table("complaints").insert(complaint_data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to submit complaint")
    
    new_complaint = res.data[0]

    # 4. Offload AI routing and embedding storage to the background
    background_tasks.add_task(
        process_ai_pipeline,
        new_complaint["id"],
        new_complaint["title"],
        new_complaint["description"],
        new_complaint["lat"],
        new_complaint["lon"],
        embedding_list,
        db
    )

    return new_complaint

@router.patch("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: UUID, 
    update_data: ComplaintUpdate, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    # 1. Fetch old record for audit and permission check
    old_res = db.table("complaints").select("*").eq("id", str(complaint_id)).single().execute()
    if not old_res.data:
        raise HTTPException(status_code=404, detail="Complaint not found")
    old_record = old_res.data

    # 2. Permission Check
    if old_record.get("office_id"):
        check_office_match(current_user, old_record["office_id"])

    # 3. Payload Validation
    payload = update_data.model_dump(exclude_unset=True)
    
    # Validation: Ensure worker belongs to the manager's office
    if payload.get("assigned_worker_id"):
        worker_id = payload["assigned_worker_id"]
        worker_res = db.table("profiles").select("assigned_office_id").eq("id", str(worker_id)).single().execute()
        
        if not worker_res.data:
            raise HTTPException(status_code=404, detail="Worker not found")
            
        if str(worker_res.data["assigned_office_id"]) != str(current_user.assigned_office_id) and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Cannot assign worker from a different office")

    # 4. Update
    new_res = db.table("complaints").update(payload).eq("id", str(complaint_id)).execute()
    new_record = new_res.data[0]

    # 5. Audit Logging (only if status or assigned worker changed)
    if "status" in payload or "assigned_worker_id" in payload:
        db.table("complaint_audit_logs").insert({
            "complaint_id": str(complaint_id),
            "changed_by_user_id": str(current_user.id),
            "action": "UPDATE_RECORD",
            "old_value": old_record["status"],
            "new_value": new_record["status"],
            "notes": f"Updated by {current_user.role}"
        }).execute()

    return new_record

@router.get("/", response_model=List[ComplaintResponse])
def get_all_complaints(
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    query = db.table("complaints").select("*")
    
    # Role-Based Filtering
    if current_user.role in ["manager", "worker", "supervisor"]:
        if current_user.assigned_office_id:
            # See office's complaints OR their own filed complaints
            query = query.or_(f"office_id.eq.{current_user.assigned_office_id},citizen_id.eq.{current_user.id}")
        else:
            query = query.eq("citizen_id", str(current_user.id))
    elif current_user.role == "citizen":
        query = query.eq("citizen_id", str(current_user.id))
        
    response = query.execute()
    return response.data

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: UUID, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    response = db.table("complaints").select("*").eq("id", str(complaint_id)).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint = response.data
    
    # Permission check for viewing
    if current_user.role == "citizen" and str(complaint["citizen_id"]) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role in ["manager", "worker", "supervisor"]:
        if complaint.get("office_id"):
            check_office_match(current_user, complaint["office_id"])
            
    return complaint

@router.delete("/{complaint_id}")
def delete_complaint(
    complaint_id: UUID, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete complaints")
        
    res = db.table("complaints").delete().eq("id", str(complaint_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"message": "Complaint deleted successfully"}

@router.get("/{complaint_id}/audit-logs", response_model=List[AuditLogResponse])
def get_complaint_audit_logs(
    complaint_id: UUID, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    if current_user.role not in ["admin", "manager", "supervisor"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    response = db.table("complaint_audit_logs").select("*").eq("complaint_id", str(complaint_id)).order("created_at", desc=True).execute()
    return response.data

@router.patch("/{complaint_id}/resolve", response_model=ComplaintResponse)
def resolve_complaint(
    complaint_id: UUID,
    resolution_data: ComplaintResolve,
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    old_res = db.table("complaints").select("*").eq("id", str(complaint_id)).single().execute()
    if not old_res.data:
        raise HTTPException(status_code=404, detail="Complaint not found")
    old_record = old_res.data

    # Permission check
    if current_user.role == "citizen":
        raise HTTPException(status_code=403, detail="Citizens cannot resolve tickets")
    
    check_office_match(current_user, old_record["office_id"])

    if old_record["status"] == "resolved":
         raise HTTPException(status_code=400, detail="Complaint is already resolved")

    payload = {
        "status": "resolved",
        "resolution_notes": resolution_data.resolution_notes,
        "resolution_image_url": resolution_data.resolution_image_url,
        "resolved_at": datetime.now(timezone.utc).isoformat(),
        "assigned_worker_id": str(current_user.id) if old_record.get("assigned_worker_id") is None else old_record["assigned_worker_id"]
    }

    new_res = db.table("complaints").update(payload).eq("id", str(complaint_id)).execute()
    new_record = new_res.data[0]

    # Audit resolving
    db.table("complaint_audit_logs").insert({
        "complaint_id": str(complaint_id),
        "changed_by_user_id": str(current_user.id),
        "action": "TICKET_RESOLVED",
        "old_value": old_record["status"],
        "new_value": "resolved",
        "notes": f"Resolution: {resolution_data.resolution_notes}"
    }).execute()

    return new_record

-- FILE: ./app/api/office.py --

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from supabase import Client

from app.models.office_model import OfficeCreate, OfficeUpdate, OfficeResponse
from app.models.user_model import ProfileResponse
from app.services.db_supabase import get_db
from app.services.auth import get_current_user

router = APIRouter(prefix="/offices", tags=["Offices"])

@router.post("/", response_model=OfficeResponse)
def create_office(
    office: OfficeCreate, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
        
    # 1. Separate the supported_department_ids from the main office payload
    office_data = office.model_dump(exclude={"supported_department_ids"})
    dept_ids = office.supported_department_ids

    # 2. Insert the Office
    office_res = db.table("offices").insert(office_data).execute()
    if not office_res.data:
        raise HTTPException(status_code=400, detail="Failed to create office")
    
    new_office = office_res.data[0]

    # 3. Insert into Junction Table if departments were provided
    if dept_ids:
        junction_data = [
            {"office_id": new_office["id"], "department_id": str(d_id)} 
            for d_id in dept_ids
        ]
        db.table("office_departments").insert(junction_data).execute()

    return new_office

@router.get("/{office_id}", response_model=OfficeResponse)
def get_office(
    office_id: UUID, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    response = db.table("offices").select("*").eq("id", str(office_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Office not found")
    return response.data[0]

@router.get("/", response_model=List[OfficeResponse])
def get_all_offices(
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    response = db.table("offices").select("*").execute()
    return response.data

@router.patch("/{office_id}", response_model=OfficeResponse)
def update_office(
    office_id: UUID, 
    update_data: OfficeUpdate, 
    db: Client = Depends(get_db),
    current_user: ProfileResponse = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    payload = update_data.model_dump(exclude_unset=True)
    dept_ids = payload.pop("supported_department_ids", None)
    
    # 1. Update main office record if there are fields to update
    if payload:
        office_res = db.table("offices").update(payload).eq("id", str(office_id)).execute()
        if not office_res.data:
            raise HTTPException(status_code=404, detail="Office not found")
            
    # 2. Update junction table if departments were modified
    if dept_ids is not None:
        # Wipe old connections
        db.table("office_departments").delete().eq("office_id", str(office_id)).execute()
        # Insert new connections
        if dept_ids:
            junction_data = [{"office_id": str(office_id), "department_id": str(d_id)} for d_id in dept_ids]
            db.table("office_departments").insert(junction_data).execute()

    # Return fresh data
    fresh_data = db.table("offices").select("*").eq("id", str(office_id)).execute()
    return fresh_data.data[0]

@router.delete("/{office_id}")
def delete_office(office_id: UUID, db: Client = Depends(get_db)):
    response = db.table("offices").delete().eq("id", str(office_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Office not found")
    return {"message": "Office deleted successfully"}

-- FILE: ./app/api/audit_log.py --


-- FILE: ./scratch/check_db.py --

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load from backend .env
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
    exit(1)

supabase: Client = create_client(url, key)

res = supabase.table("complaints").select("id, title, citizen_id, created_at").execute()
print(f"Total Complaints: {len(res.data)}")
for c in res.data:
    print(f"- {c['id']}: {c['title']} (Citizen: {c['citizen_id']})")

res_profiles = supabase.table("profiles").select("id, first_name, role").execute()
print(f"\nTotal Profiles: {len(res_profiles.data)}")
for p in res_profiles.data:
    print(f"- {p['id']}: {p['first_name']} ({p['role']})")

-- FILE: ./main.py --

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import department, office, complaint, profile, user

app = FastAPI(
    title="Prestige Protocol Civic API",
    description="AI-Driven Routing Backend for Civic Complaints",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this to your FRONTEND_URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(user.router)      
app.include_router(complaint.router) 
app.include_router(department.router)
app.include_router(office.router)
app.include_router(profile.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "Prestige Protocol Backend is running"
    }



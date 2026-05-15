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

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

    payload = update_data.model_dump(exclude_unset=True, mode='json')
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

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
        
    response = db.table("departments").insert(dept.model_dump(mode='json')).execute()
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
        
    update_data = dept.model_dump(exclude_unset=True, mode='json')
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


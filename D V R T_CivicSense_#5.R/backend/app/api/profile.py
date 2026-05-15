from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from supabase import Client

from app.models.user_model import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services.db_supabase import get_db
# Import get_auth_payload to break the chicken-and-egg loop
from app.services.auth import get_current_user, get_auth_payload

router = APIRouter(prefix="/profiles", tags=["Profiles"])

@router.post("/", response_model=ProfileResponse)
def create_profile(
    profile: ProfileCreate, 
    db: Client = Depends(get_db),
    payload: dict = Depends(get_auth_payload) # <--- Use the pure JWT payload here
):
    token_role = payload.get("role", "citizen")
    token_id = payload.get("sub")
    
    # Dump the requested data
    profile_data = profile.model_dump(exclude={"email", "password"}, mode='json')
    
    # SECURITY GATE:
    # If a normal user is hitting this route, force the profile ID to match 
    # their JWT token so they can't create profiles for other people.
    if token_role != "admin" and token_role != "manager":
        profile_data["id"] = token_id
        profile_data["role"] = "citizen" # Prevent privilege escalation (hacking themselves to admin)
    
    # If they are an admin, they can pass whatever 'id' and 'role' they want in the body
        
    try:
        response = db.table("profiles").insert(profile_data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create profile")
        return response.data[0]
    except Exception as e:
        # Catch duplicate key errors if they already have a profile
        if "duplicate key value" in str(e):
            raise HTTPException(status_code=409, detail="Profile already exists for this user")
        raise HTTPException(status_code=500, detail=str(e))

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
    # SECURITY GATE: Only self, admin, or manager can update
    if current_user.role not in ["admin", "manager"] and str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Access denied")
        
    payload = profile_update.model_dump(exclude_unset=True, mode='json')
    
    # Restrict role/office updates to admins and managers
    if current_user.role not in ["admin", "manager"]:
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

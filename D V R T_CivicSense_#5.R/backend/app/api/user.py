from app.models.user_model import AuthResponse, LoginRequest, SignupRequest
from app.services.db_supabase import get_db
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, db=Depends(get_db)):
    role = payload.role.value if payload.role else "citizen"
    metadata = {
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "role": role,
        "phone_number": payload.phone_number,
        "address_line_1": payload.address_line_1,
        "address_line_2": payload.address_line_2,
        "city": payload.city,
        "state": payload.state,
        "pincode": payload.pincode,
        "assigned_department_id": str(payload.assigned_department_id) if payload.assigned_department_id else None
    }

    res = db.auth.sign_up(
        {
            "email": payload.email,
            "password": payload.password,
            "options": {"data": metadata},
        }
    )
    if not res.user:
        raise HTTPException(status_code=400, detail="Signup failed")

    if res.session is None:
        raise HTTPException(
            status_code=403, detail="Please verify your email before logging in."
        )

    # Best-effort profile creation (safe if an insert trigger already exists)
    try:
        profile_payload = {
            "id": res.user.id,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "phone_number": payload.phone_number,
            "address_line_1": payload.address_line_1,
            "address_line_2": payload.address_line_2,
            "city": payload.city,
            "state": payload.state,
            "pincode": payload.pincode,
            "role": role,
            "assigned_department_id": str(payload.assigned_department_id) if payload.assigned_department_id else None,
            "is_active": True,
        }
        db.table("profiles").upsert(profile_payload).execute()
    except Exception as e:
        print(f"Profile upsert failed: {str(e)}")

    return {
        "access_token": res.session.access_token,
        "user": {
            "id": res.user.id,
            "email": payload.email,
            "role": role,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "assigned_department_id": payload.assigned_department_id
        },
    }


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db=Depends(get_db)):
    try:
        res = db.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
        user_data = None

        try:
            profile = (
                db.table("profiles")
                .select("*")
                .eq("id", res.user.id)
                .single()
                .execute()
            )
            user_data = profile.data
        except Exception:
            user_data = None

        if not user_data:
            meta = getattr(res.user, "user_metadata", {}) or {}
            user_data = {
                "id": res.user.id,
                "first_name": meta.get("first_name", "Citizen"),
                "last_name": meta.get("last_name", "User"),
                "role": meta.get("role", "citizen"),
                "assigned_office_id": meta.get("assigned_office_id"),
                "assigned_department_id": meta.get("assigned_department_id"),
            }

        user_data["email"] = res.user.email  # Inject email for the AuthResponse model
        return {"access_token": res.session.access_token, "user": user_data}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid credentials: {str(e)}")

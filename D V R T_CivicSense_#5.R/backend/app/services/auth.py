import json
from datetime import datetime, timezone

import jwt
from app.config import env
from app.models.user_model import ProfileResponse
from app.services.db_supabase import get_db
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWK, PyJWKClient
from supabase import Client

security = HTTPBearer()


def get_auth_payload(token: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Decodes and validates the Supabase JWT."""
    try:
        token_str = token.credentials
        header = jwt.get_unverified_header(token_str)
        token_alg = header.get("alg")

        public_key = None
        algorithms = [token_alg] if token_alg else ["ES256", "RS256", "HS256"]

        if token_alg == "HS256":
            if not env.JWT_SECRET:
                raise HTTPException(status_code=500, detail="JWT secret not configured")
            try:
                jwk_data = json.loads(env.JWT_SECRET)
                jwk_dict = jwk_data["keys"][0] if "keys" in jwk_data else jwk_data
                public_key = PyJWK(jwk_dict).key
            except json.JSONDecodeError:
                public_key = env.JWT_SECRET
        else:
            # ES256/RS256 path
            if env.JWT_SECRET:
                try:
                    jwk_data = json.loads(env.JWT_SECRET)
                    jwk_dict = jwk_data["keys"][0] if "keys" in jwk_data else jwk_data
                    public_key = PyJWK(jwk_dict).key
                except json.JSONDecodeError:
                    public_key = None

            if not public_key:
                if not env.SUPABASE_URL:
                    raise HTTPException(
                        status_code=500, detail="Supabase URL not configured"
                    )
                jwks_url = f"{env.SUPABASE_URL.rstrip('/')}/auth/v1/certs"
                jwk_client = PyJWKClient(jwks_url)
                public_key = jwk_client.get_signing_key_from_jwt(token_str).key

        return jwt.decode(
            token_str,
            public_key,
            algorithms=algorithms,
            options={"verify_aud": True},
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        print(f"JWT Verification Failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as e:
        print(f"Auth configuration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Server Auth Configuration Error")


async def get_current_user(
    payload: dict = Depends(get_auth_payload),
    db: Client = Depends(get_db),
) -> ProfileResponse:
    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject identifier")

    current_time = datetime.now(timezone.utc).isoformat()

    # Try to fetch from profiles table first
    try:
        response = db.table("profiles").select("*").eq("id", user_id).single().execute()
        if response.data:
            data = response.data
            data.setdefault("created_at", current_time)
            data.setdefault("updated_at", current_time)
            data.setdefault("role", "citizen")
            data.setdefault("is_active", True)
            return ProfileResponse(**data)
    except Exception as e:
        print(f"Profile lookup failed, falling back to token: {str(e)}")

    # Fallback to token metadata if profile row doesn't exist yet
    meta = payload.get("user_metadata", {}) or {}
    profile_data = {
        "id": user_id,
        "email": email,
        "first_name": meta.get("first_name", "Citizen"),
        "last_name": meta.get("last_name", "User"),
        "role": meta.get("role", "citizen"),
        "assigned_office_id": meta.get("assigned_office_id"),
        "assigned_department_id": meta.get("assigned_department_id"),
        "phone_number": meta.get("phone_number"),
        "address_line_1": meta.get("address_line_1"),
        "address_line_2": meta.get("address_line_2"),
        "city": meta.get("city"),
        "state": meta.get("state"),
        "pincode": meta.get("pincode"),
        "is_active": True,
        "created_at": current_time,
        "updated_at": current_time,
    }

    return ProfileResponse(**profile_data)


def check_office_match(user: ProfileResponse, office_id: str):
    if user.role == "admin":
        return True
    if not user.assigned_office_id:
        raise HTTPException(
            status_code=403, detail="User has no assigned office to verify jurisdiction"
        )
    if str(user.assigned_office_id) != str(office_id):
        raise HTTPException(
            status_code=403,
            detail="Access denied: This record belongs to another office",
        )
    return True

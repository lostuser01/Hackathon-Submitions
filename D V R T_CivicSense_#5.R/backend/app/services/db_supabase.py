from supabase import create_client, Client
from app.config import env

def get_db() -> Client:
    if not env.SUPABASE_KEY or not env.SUPABASE_URL:
        raise ValueError("Supabase credentials not found in environment variables.")
    return create_client(env.SUPABASE_URL, env.SUPABASE_KEY)


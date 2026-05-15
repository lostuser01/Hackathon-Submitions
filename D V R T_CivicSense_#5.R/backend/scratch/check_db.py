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

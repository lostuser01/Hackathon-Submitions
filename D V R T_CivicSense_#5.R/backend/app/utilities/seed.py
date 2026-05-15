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

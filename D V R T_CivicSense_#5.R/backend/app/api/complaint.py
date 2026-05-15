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
    payload = update_data.model_dump(exclude_unset=True, mode='json')
    
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

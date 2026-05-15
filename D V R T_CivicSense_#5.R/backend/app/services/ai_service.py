import logging
from supabase import Client
from fastembed import TextEmbedding

# Initialize model once
embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

async def process_new_complaint_ai(
    complaint_id: str, 
    title: str, 
    description: str, 
    lat: float, 
    lon: float, 
    db: Client
):
    try:
        # 1. Generate Vector
        text_to_embed = f"{title}. {description}"
        vectors = list(embedding_model.embed([text_to_embed]))
        embedding_list = vectors[0].tolist()

        # 2. Store Vector for future similarity searches
        db.table("complaint_embeddings").upsert({
            "complaint_id": complaint_id,
            "embedding": embedding_list,
            "model_version": "fastembed-bge-small-en"
        }).execute()

        # 3. Semantic Routing: Find best Department
        # Calls the predict_department RPC in Supabase
        predict_res = db.rpc("predict_department", {
            "query_embedding": embedding_list, 
            "match_limit": 3
        }).execute()

        if predict_res.data and predict_res.data[0]["confidence_score"] > 0.60:
            dept_id = predict_res.data[0]["predicted_department_id"]
            
            # 4. Spatial Routing: Find closest Office for that Dept
            office_res = db.rpc("get_closest_office", {
                "query_lat": lat, 
                "query_lon": lon, 
                "target_department_id": dept_id
            }).execute()
            
            assigned_office_id = office_res.data if office_res.data else None

            # 5. Update Record
            db.table("complaints").update({
                "department_id": dept_id,
                "office_id": assigned_office_id,
                "status": "routed"
            }).eq("id", complaint_id).execute()
            
            logging.info(f"Complaint {complaint_id} auto-routed to Dept {dept_id}")

    except Exception as e:
        logging.error(f"AI Routing Error for {complaint_id}: {str(e)}")

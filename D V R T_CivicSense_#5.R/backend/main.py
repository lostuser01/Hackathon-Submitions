from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import department, office, complaint, profile, user

app = FastAPI(
    title="Prestige Protocol Civic API",
    description="AI-Driven Routing Backend for Civic Complaints",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this to your FRONTEND_URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(user.router)      
app.include_router(complaint.router) 
app.include_router(department.router)
app.include_router(office.router)
app.include_router(profile.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "Prestige Protocol Backend is running"
    }



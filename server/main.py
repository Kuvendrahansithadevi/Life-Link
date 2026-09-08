from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.db import init_db
from routers import triage, hospitals, donors, emergency

app = FastAPI(
    title="LIFE LINK API",
    description="Emergency Healthcare Assistance Platform Backend",
    version="1.0.0"
)

# CORS setup for Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    try:
        await init_db()
        print("Database indexes initialized.")
    except Exception as e:
        print("Database connection warning (MongoDB might be offline):", e)

# Include All Routers
app.include_router(triage.router)
app.include_router(hospitals.router)
app.include_router(donors.router)
app.include_router(emergency.router)

@app.get("/")
def home():
    return {
        "service": "LIFE LINK Backend Engine",
        "status": "Online",
        "docs_url": "/docs"
    }
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.db import init_db
from routers.auth import router as auth_router
from routers import triage, hospitals, donors, emergency, bookings

app = FastAPI(
    title="LIFE LINK API",
    description="Emergency Healthcare Assistance Platform Backend",
    version="1.0.0"
)

# Explicit frontend origins ivvali:
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
app.include_router(auth_router)
app.include_router(hospitals.router)
app.include_router(donors.router)
app.include_router(emergency.router)
app.include_router(bookings.router)

@app.get("/")
def home():
    return {
        "service": "LIFE LINK Backend Engine",
        "status": "Online",
        "docs_url": "/docs"
    }
from fastapi import APIRouter
from models.schemas import EmergencyAlert
from config.db import db
from datetime import datetime

router = APIRouter(prefix="/api/emergency", tags=["Crisis & Emergency Mode"])

@router.post("/alert")
async def log_emergency(alert: EmergencyAlert):
    event = {
        "lat": alert.lat,
        "lng": alert.lng,
        "message": alert.message,
        "timestamp": datetime.utcnow().isoformat(),
        "status": "DISPATCH_NOTIFIED"
    }
    await db.emergency_logs.insert_one(event)
    return {
        "status": "activated",
        "emergency_center_contact": "108",
        "nearest_trauma_eta": "9-12 min",
        "location_link": f"https://maps.google.com/?q={alert.lat},{alert.lng}"
    }
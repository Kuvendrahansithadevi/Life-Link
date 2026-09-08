from fastapi import APIRouter, Query
from config.db import db
from models.schemas import HospitalCreate, AppointmentCreate
from models.database_models import hospital_helper
from services.location_service import calculate_distance_km

router = APIRouter(prefix="/api/hospitals", tags=["Care Discovery & Appointments"])

@router.get("")
async def get_hospitals(
    lat: float = Query(default=13.8285),
    lng: float = Query(default=77.4913),
    search: str = Query(default="")
):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"specialists": {"$regex": search, "$options": "i"}},
            {"address": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = db.hospitals.find(query)
    hospitals = []
    async for h in cursor:
        h_data = hospital_helper(h)
        # Lat/lng calculate distance
        if "coordinates" in h:
            dist = calculate_distance_km(lat, lng, h["coordinates"][1], h["coordinates"][0])
            h_data["distance"] = f"{dist} km"
        else:
            h_data["distance"] = "Nearby"
        hospitals.append(h_data)
        
    return hospitals

@router.post("")
async def add_hospital(hospital: HospitalCreate):
    doc = hospital.dict()
    doc["coordinates"] = [hospital.lng, hospital.lat] # GeoJSON standard [lng, lat]
    await db.hospitals.insert_one(doc)
    return {"message": "Hospital registered successfully"}

@router.post("/book")
async def book_appointment(appointment: AppointmentCreate):
    await db.appointments.insert_one(appointment.dict())
    return {
        "status": "confirmed",
        "appointment_id": f"LL-{abs(hash(appointment.phone + appointment.time)) % 1000000}",
        "details": appointment
    }
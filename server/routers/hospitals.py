from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

from config.db import db
from models.schemas import AppointmentCreate, HospitalCreate, HospitalUpdate
from services.location_service import calculate_distance_km

router = APIRouter(prefix="/api/hospitals", tags=["Care Discovery & Appointments"])


def serialize_hospital(hospital: dict, lat: float | None = None, lng: float | None = None) -> dict:
    coordinates = hospital.get("coordinates") or []
    stored_lng = coordinates[0] if len(coordinates) >= 2 else hospital.get("lng")
    stored_lat = coordinates[1] if len(coordinates) >= 2 else hospital.get("lat")
    distance = None
    if lat is not None and lng is not None and stored_lat is not None and stored_lng is not None:
        distance = calculate_distance_km(lat, lng, stored_lat, stored_lng)

    return {
        "id": str(hospital["_id"]),
        "name": hospital.get("name", ""),
        "address": hospital.get("address", ""),
        "phone": hospital.get("phone", ""),
        "specialists": hospital.get("specialists", []),
        "lat": stored_lat,
        "lng": stored_lng,
        "total_beds": hospital.get("total_beds", 0),
        "icu_beds": hospital.get("icu_beds", 0),
        "available_beds": hospital.get("available_beds", 0),
        "available_now": hospital.get("available_now", True),
        "rating": hospital.get("rating", 4.5),
        "wait_time": hospital.get("wait_time", "15 min"),
        "distance_km": distance,
        "distance": f"{distance:.1f} km" if distance is not None else "Nearby",
    }


def parse_object_id(hospital_id: str) -> ObjectId:
    if not ObjectId.is_valid(hospital_id):
        raise HTTPException(status_code=400, detail="Invalid hospital ID")
    return ObjectId(hospital_id)


@router.get("")
async def get_hospitals(
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
    specialist: Optional[str] = Query(default=None),
    search: str = Query(default=""),
):
    query = {}
    filters = []
    if search:
        filters.append({"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"specialists": {"$regex": search, "$options": "i"}},
            {"address": {"$regex": search, "$options": "i"}},
        ]})
    if specialist:
        filters.append({"specialists": {"$regex": specialist, "$options": "i"}})
    if filters:
        query["$and"] = filters

    hospitals = [serialize_hospital(hospital, lat, lng) async for hospital in db.hospitals.find(query)]
    if lat is not None and lng is not None:
        hospitals.sort(key=lambda hospital: hospital["distance_km"] if hospital["distance_km"] is not None else float("inf"))
    return hospitals


@router.post("")
async def add_hospital(hospital: HospitalCreate):
    document = hospital.model_dump()
    document["coordinates"] = [hospital.lng, hospital.lat]
    document.pop("lat", None)
    document.pop("lng", None)
    result = await db.hospitals.insert_one(document)
    created = await db.hospitals.find_one({"_id": result.inserted_id})
    return serialize_hospital(created)


@router.put("/{hospital_id}")
async def update_hospital(hospital_id: str, hospital: HospitalUpdate):
    object_id = parse_object_id(hospital_id)
    updates = {key: value for key, value in hospital.model_dump(exclude_unset=True).items() if value is not None}
    if "lat" in updates or "lng" in updates:
        current = await db.hospitals.find_one({"_id": object_id})
        if not current:
            raise HTTPException(status_code=404, detail="Hospital not found")
        coordinates = current.get("coordinates", [None, None])
        updates["coordinates"] = [updates.pop("lng", coordinates[0]), updates.pop("lat", coordinates[1])]
    if not updates:
        raise HTTPException(status_code=400, detail="No hospital fields to update")

    result = await db.hospitals.update_one({"_id": object_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return serialize_hospital(await db.hospitals.find_one({"_id": object_id}))


@router.delete("/{hospital_id}")
async def delete_hospital(hospital_id: str):
    result = await db.hospitals.delete_one({"_id": parse_object_id(hospital_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return {"message": "Hospital deleted successfully", "id": hospital_id}


@router.post("/book")
async def book_appointment(appointment: AppointmentCreate):
    await db.appointments.insert_one(appointment.model_dump())
    return {
        "status": "confirmed",
        "appointment_id": f"LL-{abs(hash(appointment.phone + appointment.time)) % 1000000}",
        "details": appointment,
    }
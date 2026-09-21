from datetime import datetime, timedelta
from typing import Literal, Optional
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel

from config.db import db
from models.schemas import AppointmentCreate, DiscoveryBookingCreate, HospitalBedsUpdate, HospitalBloodRequestCreate, HospitalCreate, HospitalUpdate, SpecialistAvailabilityUpdate
from services.location_service import calculate_distance_km


class BookingStatusUpdate(BaseModel):
    status: Literal["Confirmed", "Completed", "Cancelled"]

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
        "description": hospital.get("description", ""),
        "conditions": hospital.get("conditions", []),
        "treatments": hospital.get("treatments", []),
        "specialist_profiles": hospital.get("specialist_profiles", []),
        "specialist_availability": hospital.get("specialist_availability", {}),
        "lat": stored_lat,
        "lng": stored_lng,
        "total_beds": hospital.get("total_beds", 0),
        "icu_beds": hospital.get("icu_beds", 0),
        "available_beds": hospital.get("available_beds", 0),
        "available_icu_beds": hospital.get("available_icu_beds", hospital.get("icu_beds", 0)),
        "doctor_status": hospital.get("doctor_status", "Available"),
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
            {"description": {"$regex": search, "$options": "i"}},
            {"conditions": {"$regex": search, "$options": "i"}},
            {"treatments.name": {"$regex": search, "$options": "i"}},
        ]})
    if specialist:
        filters.append({"specialists": {"$regex": specialist, "$options": "i"}})
    if filters:
        query["$and"] = filters

    hospitals = [serialize_hospital(hospital, lat, lng) async for hospital in db.hospitals.find(query)]
    if lat is not None and lng is not None:
        hospitals.sort(key=lambda hospital: hospital["distance_km"] if hospital["distance_km"] is not None else float("inf"))
    return hospitals


async def resolve_hospital_id(hospital_id: Optional[str], authorization: Optional[str]) -> str:
    if authorization and authorization.startswith("Bearer token_"):
        user_id = authorization.removeprefix("Bearer token_")
        user = await db.users.find_one({"_id": ObjectId(user_id)}) if ObjectId.is_valid(user_id) else None
        if user and user.get("role") == "hospital" and user.get("hospitalId"):
            if hospital_id and hospital_id != user["hospitalId"]:
                raise HTTPException(status_code=403, detail="Hospital access is restricted to the linked hospital")
            return user["hospitalId"]
    if hospital_id:
        return hospital_id
    raise HTTPException(status_code=401, detail="Hospital staff identity is required")


@router.get("/my-hospital")
async def get_my_hospital(
    hospital_id: Optional[str] = Query(default=None),
    authorization: Optional[str] = Header(default=None),
):
    resolved_id = await resolve_hospital_id(hospital_id, authorization)
    hospital = await db.hospitals.find_one({"_id": parse_object_id(resolved_id)})
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return serialize_hospital(hospital)


@router.post("")
async def add_hospital(hospital: HospitalCreate):
    document = hospital.model_dump()
    staff_email = document.pop("staff_email")
    temporary_password = document.pop("temporary_password")
    document["coordinates"] = [hospital.lng, hospital.lat]
    document.pop("lat", None)
    document.pop("lng", None)
    result = await db.hospitals.insert_one(document)
    created = await db.hospitals.find_one({"_id": result.inserted_id})
    hospital_id = str(result.inserted_id)
    existing_staff = await db.users.find_one({"$or": [{"email": staff_email}, {"username": hospital.name}]})
    if existing_staff:
        await db.hospitals.delete_one({"_id": result.inserted_id})
        raise HTTPException(status_code=400, detail="Hospital staff email or username already exists")
    await db.users.insert_one({
        "username": hospital.name,
        "email": staff_email,
        "password": temporary_password,
        "role": "hospital",
        "hospitalId": hospital_id,
        "created_at": datetime.utcnow(),
    })
    return {
        "hospital": serialize_hospital(created),
        "credentials": {"email": staff_email, "temporaryPassword": temporary_password},
    }


@router.get("/{hospital_id}")
async def get_hospital(hospital_id: str):
    hospital = await db.hospitals.find_one({"_id": parse_object_id(hospital_id)})
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return serialize_hospital(hospital)


@router.get("/{hospital_id}/bookings")
async def get_hospital_bookings(
    hospital_id: str,
    authorization: Optional[str] = Header(default=None),
):
    hospital_id = await resolve_hospital_id(hospital_id, authorization)
    parse_object_id(hospital_id)
    bookings = []
    async for booking in db.bookings.find({"hospitalId": hospital_id}).sort("created_at", -1):
        bookings.append({
            "id": str(booking["_id"]),
            "userId": booking.get("userId", ""),
            "hospitalId": booking.get("hospitalId", hospital_id),
            "hospitalName": booking.get("hospitalName", ""),
            "patientName": booking.get("patientName", ""),
            "notes": booking.get("notes", ""),
            "specialist": booking.get("specialist", ""),
            "appointmentDate": booking.get("appointmentDate", ""),
            "timeSlot": booking.get("timeSlot", ""),
            "status": booking.get("status", "Confirmed"),
            "createdAt": booking.get("created_at"),
        })
    return bookings


@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    update: BookingStatusUpdate,
    authorization: Optional[str] = Header(default=None),
):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    booking_filter = {"_id": ObjectId(booking_id)}
    if authorization and authorization.startswith("Bearer token_"):
        linked_hospital_id = await resolve_hospital_id(None, authorization)
        booking_filter["hospitalId"] = linked_hospital_id
    result = await db.bookings.update_one(
        booking_filter,
        {"$set": {"status": update.status}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"success": True, "id": booking_id, "status": update.status}


@router.patch("/{hospital_id}/beds")
async def update_hospital_beds(
    hospital_id: str,
    update: HospitalBedsUpdate,
    authorization: Optional[str] = Header(default=None),
):
    object_id = parse_object_id(await resolve_hospital_id(hospital_id, authorization))
    result = await db.hospitals.update_one(
        {"_id": object_id},
        {"$set": {
            "available_beds": update.available_beds,
            "available_icu_beds": update.icu_beds,
            "icu_beds": update.icu_beds,
            "wait_time": update.wait_time,
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return serialize_hospital(await db.hospitals.find_one({"_id": object_id}))


@router.patch("/{hospital_id}/specialists")
async def update_specialist_availability(
    hospital_id: str,
    update: SpecialistAvailabilityUpdate,
    authorization: Optional[str] = Header(default=None),
):
    object_id = parse_object_id(await resolve_hospital_id(hospital_id, authorization))
    hospital = await db.hospitals.find_one({"_id": object_id})
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    if update.specialist not in hospital.get("specialists", []):
        raise HTTPException(status_code=400, detail="Specialist is not registered at this hospital")
    result = await db.hospitals.update_one(
        {"_id": object_id},
        {"$set": {f"specialist_availability.{update.specialist}": update.on_duty}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return serialize_hospital(await db.hospitals.find_one({"_id": object_id}))


@router.put("/{hospital_id}")
async def update_hospital(
    hospital_id: str,
    hospital: HospitalUpdate,
    authorization: Optional[str] = Header(default=None),
):
    resolved_id = await resolve_hospital_id(hospital_id, authorization)
    object_id = parse_object_id(resolved_id)
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


@router.get("/{hospital_id}/availability")
async def get_availability(hospital_id: str, specialist_id: str, appointment_date: str):
    hospital = await db.hospitals.find_one({"_id": parse_object_id(hospital_id)})
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    specialist = next((item for item in hospital.get("specialist_profiles", []) if item.get("id") == specialist_id), None)
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    try:
        date = datetime.strptime(appointment_date, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Date must use YYYY-MM-DD") from exc
    day = date.strftime("%A").lower()
    slots = []
    for schedule in specialist.get("schedule", []):
        if schedule.get("day", "").lower() != day:
            continue
        start = datetime.strptime(schedule["start_time"], "%H:%M")
        end = datetime.strptime(schedule["end_time"], "%H:%M")
        while start < end:
            slots.append(start.strftime("%H:%M"))
            start += timedelta(minutes=30)
    booked = await db.bookings.find({"hospitalId": hospital_id, "specialistId": specialist_id, "appointmentDate": appointment_date, "paymentStatus": {"$ne": "FAILED"}}).to_list(length=None)
    booked_slots = {item.get("timeSlot") for item in booked}
    return {"date": appointment_date, "slots": [slot for slot in slots if slot not in booked_slots]}


@router.post("/{hospital_id}/specialists")
async def add_specialist(hospital_id: str, specialist: dict, authorization: Optional[str] = Header(default=None)):
    resolved_id = await resolve_hospital_id(hospital_id, authorization)
    specialist["id"] = specialist.get("id") or str(uuid4())
    specialist.setdefault("schedule", [])
    result = await db.hospitals.update_one({"_id": parse_object_id(resolved_id)}, {"$push": {"specialist_profiles": specialist}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return specialist


@router.post("/{hospital_id}/treatments")
async def add_treatment(hospital_id: str, treatment: dict, authorization: Optional[str] = Header(default=None)):
    resolved_id = await resolve_hospital_id(hospital_id, authorization)
    treatment["id"] = treatment.get("id") or str(uuid4())
    result = await db.hospitals.update_one({"_id": parse_object_id(resolved_id)}, {"$push": {"treatments": treatment}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return treatment


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


@router.post("/my-hospital/blood-request")
async def broadcast_hospital_blood_request(
    request: HospitalBloodRequestCreate,
    hospital_id: Optional[str] = Query(default=None),
    authorization: Optional[str] = Header(default=None),
):
    resolved_id = await resolve_hospital_id(hospital_id, authorization)
    hospital = await db.hospitals.find_one({"_id": parse_object_id(resolved_id)})
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    document = request.model_dump(by_alias=False)
    document.update({
        "bloodGroup": document.pop("blood_group"),
        "hospitalName": hospital.get("name", ""),
        "hospitalId": resolved_id,
        "requesterName": document.pop("requester_name"),
        "requesterPhone": document.pop("requester_phone"),
        "status": "active",
        "isHospitalVerified": True,
        "created_at": datetime.utcnow(),
    })
    result = await db.blood_requests.insert_one(document)
    return {"success": True, "id": str(result.inserted_id), "hospitalName": hospital.get("name", "")}


@router.get("/my-hospital/queue")
async def get_hospital_queue(
    hospital_id: Optional[str] = Query(default=None),
    authorization: Optional[str] = Header(default=None),
):
    resolved_id = await resolve_hospital_id(hospital_id, authorization)
    object_id = parse_object_id(resolved_id)
    bookings = [
        {"id": str(item["_id"]), "type": "booking", **{key: value for key, value in item.items() if key != "_id"}}
        async for item in db.appointments.find({"hospital_id": resolved_id}).sort("created_at", -1).limit(25)
    ]
    new_bookings = [
        {"id": str(item["_id"]), "type": "booking", **{key: value for key, value in item.items() if key != "_id"}}
        async for item in db.bookings.find({"hospitalId": resolved_id}).sort("created_at", -1).limit(25)
    ]
    triage = [
        {"id": str(item["_id"]), "type": "triage", **{key: value for key, value in item.items() if key != "_id"}}
        async for item in db.triage_requests.find({"hospitalId": resolved_id}).sort("created_at", -1).limit(25)
    ]
    return sorted(bookings + new_bookings + triage, key=lambda item: item.get("created_at", datetime.min), reverse=True)[:25]
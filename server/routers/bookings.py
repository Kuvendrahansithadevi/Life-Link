from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config.db import db

router = APIRouter(prefix="/api/bookings", tags=["Appointments"])


class BookingCreate(BaseModel):
    userId: str
    hospitalId: str
    hospitalName: str
    specialist: str
    appointmentDate: str
    timeSlot: str
    patientName: str
    notes: str = ""


@router.post("")
async def create_booking(booking: BookingCreate):
    document = booking.model_dump()
    document.update({"status": "Confirmed", "created_at": datetime.utcnow()})
    result = await db.bookings.insert_one(document)
    return {"success": True, "id": str(result.inserted_id), "status": "Confirmed"}


@router.get("/{user_id}")
async def get_user_bookings(user_id: str):
    bookings = []
    async for booking in db.bookings.find({"userId": user_id}).sort("appointmentDate", 1):
        hospital = None
        hospital_id = booking.get("hospitalId")
        if hospital_id and ObjectId.is_valid(hospital_id):
            hospital = await db.hospitals.find_one({"_id": ObjectId(hospital_id)}, {"address": 1})
        bookings.append({
            "id": str(booking["_id"]),
            "userId": booking.get("userId", ""),
            "hospitalId": hospital_id,
            "hospitalName": booking.get("hospitalName", ""),
            "hospitalAddress": (hospital or {}).get("address", ""),
            "specialist": booking.get("specialist", ""),
            "appointmentDate": booking.get("appointmentDate", ""),
            "timeSlot": booking.get("timeSlot", ""),
            "patientName": booking.get("patientName", ""),
            "notes": booking.get("notes", ""),
            "status": booking.get("status", "Confirmed"),
            "createdAt": booking.get("created_at"),
        })
    return bookings


@router.delete("/{booking_id}")
async def cancel_booking(booking_id: str):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    result = await db.bookings.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": "Cancelled", "cancelled_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"success": True, "id": booking_id, "status": "Cancelled"}

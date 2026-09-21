from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from config.db import db
from models.schemas import DiscoveryBookingCreate, PaymentVerification

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


class PaymentCreate(BaseModel):
    booking_id: str


@router.post("")
async def create_booking(booking: BookingCreate):
    document = booking.model_dump()
    document.update({"status": "Pending payment", "paymentStatus": "PENDING", "created_at": datetime.utcnow()})
    result = await db.bookings.insert_one(document)
    return {"success": True, "id": str(result.inserted_id), "status": "Pending payment"}


@router.post("/discovery")
async def create_discovery_booking(booking: DiscoveryBookingCreate, authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer token_"):
        raise HTTPException(status_code=401, detail="Sign in to book an appointment")
    if authorization.removeprefix("Bearer token_") != booking.user_id:
        raise HTTPException(status_code=403, detail="You can only book for your own account")
    hospital = await db.hospitals.find_one({"_id": __import__("bson").ObjectId(booking.hospital_id)}) if __import__("bson").ObjectId.is_valid(booking.hospital_id) else None
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    specialist = next((item for item in hospital.get("specialist_profiles", []) if item.get("id") == booking.specialist_id), None)
    treatment = next((item for item in hospital.get("treatments", []) if item.get("id") == booking.treatment_id), None)
    if not specialist or not treatment:
        raise HTTPException(status_code=400, detail="Choose a valid specialist and treatment")
    try:
        appointment_day = datetime.strptime(booking.appointment_date, "%Y-%m-%d").strftime("%A").lower()
        requested_time = datetime.strptime(booking.time_slot, "%H:%M")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Use YYYY-MM-DD dates and HH:MM time slots") from exc
    schedule_match = False
    for schedule in specialist.get("schedule", []):
        if schedule.get("day", "").lower() != appointment_day:
            continue
        start = datetime.strptime(schedule["start_time"], "%H:%M")
        end = datetime.strptime(schedule["end_time"], "%H:%M")
        if start <= requested_time < end and (requested_time - start) % timedelta(minutes=30) == timedelta(0):
            schedule_match = True
            break
    if not schedule_match:
        raise HTTPException(status_code=400, detail="That time is outside the specialist's schedule")
    existing = await db.bookings.find_one({"hospitalId": booking.hospital_id, "specialistId": booking.specialist_id, "appointmentDate": booking.appointment_date, "timeSlot": booking.time_slot, "paymentStatus": {"$ne": "FAILED"}})
    if existing:
        raise HTTPException(status_code=409, detail="That time slot is no longer available")
    document = {
        "userId": booking.user_id,
        "hospitalId": booking.hospital_id,
        "hospitalName": hospital.get("name", ""),
        "specialistId": booking.specialist_id,
        "specialist": specialist.get("name", specialist.get("specialization", "")),
        "treatmentId": booking.treatment_id,
        "treatment": treatment.get("name", ""),
        "amount": float(treatment.get("price", treatment.get("starting_price", 0)) or 0),
        "appointmentDate": booking.appointment_date,
        "timeSlot": booking.time_slot,
        "slotKey": f"{booking.hospital_id}:{booking.specialist_id}:{booking.appointment_date}:{booking.time_slot}",
        "patientName": booking.patient_name,
        "patientPhone": booking.phone,
        "notes": booking.notes,
        "status": "Pending payment",
        "paymentStatus": "PENDING",
        "created_at": datetime.utcnow(),
    }
    result = await db.bookings.insert_one(document)
    return {"success": True, "id": str(result.inserted_id), "status": document["status"], "paymentStatus": "PENDING", "amount": document["amount"]}


@router.post("/payments/create")
async def create_test_payment(payment: PaymentCreate, authorization: str | None = Header(default=None)):
    from bson import ObjectId
    if not ObjectId.is_valid(payment.booking_id):
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    booking = await db.bookings.find_one({"_id": ObjectId(payment.booking_id), "paymentStatus": "PENDING"})
    if not booking:
        raise HTTPException(status_code=404, detail="Pending booking not found")
    if not authorization or authorization.removeprefix("Bearer token_") != booking.get("userId"):
        raise HTTPException(status_code=403, detail="You can only pay for your own booking")
    return {"mode": "TEST", "message": "Development payment flow. No real money is charged.", "bookingId": payment.booking_id, "amount": booking.get("amount", 0), "testReferencePrefix": "test_success_"}


@router.post("/payments/verify")
async def verify_test_payment(payment: PaymentVerification, authorization: str | None = Header(default=None)):
    from bson import ObjectId
    if not ObjectId.is_valid(payment.booking_id) or not payment.payment_reference.startswith("test_success_"):
        raise HTTPException(status_code=400, detail="Use a valid development payment reference")
    booking = await db.bookings.find_one({"_id": ObjectId(payment.booking_id), "paymentStatus": "PENDING"})
    if not booking:
        raise HTTPException(status_code=404, detail="Pending booking not found")
    if not authorization or authorization.removeprefix("Bearer token_") != booking.get("userId"):
        raise HTTPException(status_code=403, detail="You can only verify your own booking")
    result = await db.bookings.update_one({"_id": ObjectId(payment.booking_id), "paymentStatus": "PENDING"}, {"$set": {"paymentStatus": "PAID", "paymentReference": payment.payment_reference, "status": "Confirmed", "paid_at": datetime.utcnow()}})
    if result.modified_count == 0:
        raise HTTPException(status_code=409, detail="Payment could not be verified")
    return {"success": True, "status": "Confirmed", "paymentStatus": "PAID"}


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
            "treatment": booking.get("treatment", ""),
            "amount": booking.get("amount", 0),
            "paymentStatus": booking.get("paymentStatus", "PENDING"),
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

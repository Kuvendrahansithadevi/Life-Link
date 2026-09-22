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
    try:
        appointment_date = datetime.strptime(booking.appointment_date, "%Y-%m-%d").date()
        appointment_time = datetime.strptime(booking.appointment_time, "%H:%M").time()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Use YYYY-MM-DD dates and HH:MM times") from exc
    if appointment_date < datetime.utcnow().date():
        raise HTTPException(status_code=400, detail="Appointment date cannot be in the past")
    specialist = next((item for item in hospital.get("specialist_profiles", []) if item.get("id") == booking.specialist_id), None) if booking.specialist_id else None
    treatment = next((item for item in hospital.get("treatments", []) if item.get("id") == booking.treatment_id), None) if booking.treatment_id else None
    if booking.appointment_type == "specialist":
        if not specialist or treatment:
            raise HTTPException(status_code=400, detail="Choose one valid specialist appointment")
        amount = specialist.get("consultation_fee")
        subject_name = specialist.get("name", specialist.get("specialization", "Specialist"))
        subject_description = specialist.get("specialization", "Specialist consultation")
    else:
        if not treatment or specialist:
            raise HTTPException(status_code=400, detail="Choose one valid treatment appointment")
        amount = treatment.get("price", treatment.get("starting_price"))
        subject_name = treatment.get("name", "Treatment")
        subject_description = treatment.get("description", "Treatment service")
    schedules = specialist.get("schedule", []) if specialist else []
    if treatment and not schedules:
        schedules = [schedule for profile in hospital.get("specialist_profiles", []) for schedule in profile.get("schedule", [])]
    schedule_match = False
    day_name = appointment_date.strftime("%A").lower()
    for schedule in schedules:
        if schedule.get("active", True) is False:
            continue
        if not specialist and schedule.get("date") and schedule.get("date") != booking.appointment_date:
            continue
        if specialist and schedule.get("date") != booking.appointment_date:
            continue
        if specialist and not schedule.get("date"):
            continue
        if not specialist and not schedule.get("date") and schedule.get("day", "").lower() != day_name:
            continue
        start = datetime.strptime(schedule["start_time"], "%H:%M")
        end = datetime.strptime(schedule["end_time"], "%H:%M")
        selected = datetime.combine(appointment_date, appointment_time)
        schedule_start = datetime.combine(appointment_date, start.time())
        schedule_end = datetime.combine(appointment_date, end.time())
        duration = int(schedule.get("slot_duration", 30) or 30)
        if schedule_start <= selected < schedule_end and (selected - schedule_start) % timedelta(minutes=duration) == timedelta(0):
            schedule_match = True
            break
    if not schedule_match:
        subject = specialist.get("name", "The specialist") if specialist else treatment.get("name", "This treatment")
        raise HTTPException(status_code=400, detail=f"{subject} is not available at the selected date and time.")
    resource_filter = {"hospitalId": booking.hospital_id, "appointmentDate": booking.appointment_date, "appointmentTime": booking.appointment_time, "paymentStatus": {"$ne": "FAILED"}, "status": {"$ne": "Cancelled"}}
    if specialist:
        resource_filter["specialistId"] = booking.specialist_id
    else:
        resource_filter["treatmentId"] = booking.treatment_id
    if await db.bookings.find_one(resource_filter):
        raise HTTPException(status_code=409, detail="That appointment time is no longer available")
    if amount is None:
        raise HTTPException(status_code=400, detail="This offering has no configured numeric fee")
    try:
        amount = float(amount)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="This offering has an invalid fee") from exc
    document = {
        "userId": booking.user_id,
        "hospitalId": booking.hospital_id,
        "hospitalName": hospital.get("name", ""),
        "appointmentType": booking.appointment_type,
        "specialistId": booking.specialist_id,
        "specialist": specialist.get("name", specialist.get("specialization", "")) if specialist else "",
        "treatmentId": booking.treatment_id,
        "treatment": treatment.get("name", "") if treatment else "",
        "subjectName": subject_name,
        "subjectDescription": subject_description,
        "amount": amount,
        "appointmentDate": booking.appointment_date,
        "appointmentTime": booking.appointment_time,
        "patientName": booking.patient_name,
        "patientPhone": booking.phone,
        "patientEmail": booking.email,
        "patientAge": booking.age,
        "notes": booking.notes,
        "status": "pending_payment",
        "paymentStatus": "PENDING",
        "created_at": datetime.utcnow(),
    }
    result = await db.bookings.insert_one(document)
    return {"success": True, "id": str(result.inserted_id), "status": document["status"], "paymentStatus": "PENDING", "amount": document["amount"], "appointmentType": document["appointmentType"]}


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
    result = await db.bookings.update_one({"_id": ObjectId(payment.booking_id), "paymentStatus": "PENDING"}, {"$set": {"paymentStatus": "PAID", "paymentReference": payment.payment_reference, "status": "paid", "paid_at": datetime.utcnow()}})
    if result.modified_count == 0:
        raise HTTPException(status_code=409, detail="Payment could not be verified")
    return {"success": True, "status": "paid", "paymentStatus": "PAID"}


@router.get("/{user_id}")
async def get_user_bookings(user_id: str, authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer token_"):
        raise HTTPException(status_code=401, detail="Sign in to view your bookings")
    authenticated_user_id = authorization.removeprefix("Bearer token_")
    if authenticated_user_id != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own bookings")
    bookings = []
    async for booking in db.bookings.find({"userId": user_id}).sort("created_at", -1):
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
            "appointmentType": booking.get("appointmentType", "legacy"),
            "specialist": booking.get("specialist", ""),
            "treatment": booking.get("treatment", ""),
            "amount": booking.get("amount", 0),
            "paymentStatus": booking.get("paymentStatus", "PENDING"),
            "appointmentDate": booking.get("appointmentDate", ""),
            "timeSlot": booking.get("timeSlot", ""),
            "appointmentTime": booking.get("appointmentTime", booking.get("timeSlot", "")),
            "patientEmail": booking.get("patientEmail", ""),
            "patientAge": booking.get("patientAge"),
            "patientName": booking.get("patientName", ""),
            "notes": booking.get("notes", ""),
            "status": booking.get("status", "Confirmed"),
            "createdAt": booking.get("created_at"),
        })
    return bookings


@router.delete("/{booking_id}")
async def cancel_booking(booking_id: str, authorization: str | None = Header(default=None)):
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    if not authorization or not authorization.startswith("Bearer token_"):
        raise HTTPException(status_code=401, detail="Sign in to cancel an appointment")
    user_id = authorization.removeprefix("Bearer token_")
    booking = await db.bookings.find_one({"_id": ObjectId(booking_id), "userId": user_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.get("status") in {"Cancelled", "cancelled", "paid", "Confirmed", "Completed"}:
        raise HTTPException(status_code=409, detail="This appointment cannot be cancelled")
    result = await db.bookings.update_one(
        {"_id": ObjectId(booking_id), "userId": user_id},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"success": True, "id": booking_id, "status": "cancelled"}

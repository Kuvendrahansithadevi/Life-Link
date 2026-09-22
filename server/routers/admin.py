import secrets
import string
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, EmailStr, Field

from config.db import db

router = APIRouter(prefix="/api/admin", tags=["Administration"])


class DoctorCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    specialization: str = Field(min_length=2, max_length=100)
    email: EmailStr


def require_admin(authorization: Optional[str]) -> None:
    if authorization != "Bearer admin_session_token":
        raise HTTPException(status_code=403, detail="Administrator access is required")


def temporary_password() -> str:
    alphabet = string.ascii_letters + string.digits
    return "LL-" + "".join(secrets.choice(alphabet) for _ in range(12))


def serialize_doctor(doctor: dict) -> dict:
    return {
        "id": str(doctor["_id"]),
        "name": doctor.get("name", ""),
        "specialization": doctor.get("specialization", "General Physician"),
        "email": doctor.get("email", ""),
        "available": doctor.get("available", True),
        "earnings": doctor.get("earnings", 0),
    }


@router.get("/doctors")
async def list_doctors(authorization: Optional[str] = Header(default=None)):
    require_admin(authorization)
    doctors = [serialize_doctor(doctor) async for doctor in db.doctors.find().sort("created_at", -1)]
    return {"doctors": doctors}


@router.post("/doctors/add")
async def add_doctor(request: DoctorCreateRequest, authorization: Optional[str] = Header(default=None)):
    require_admin(authorization)
    email = request.email.lower()
    if await db.doctors.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="A doctor with this email already exists")

    password = temporary_password()
    doctor = {
        "name": request.name.strip(),
        "specialization": request.specialization.strip(),
        "email": email,
        "password": password,
        "available": True,
        "earnings": 0,
        "wallet": 0,
        "created_at": datetime.utcnow(),
    }
    result = await db.doctors.insert_one(doctor)
    doctor["_id"] = result.inserted_id
    doctor_id = str(result.inserted_id)
    return {
        "doctor": serialize_doctor(doctor),
        "credentials": {"email": email, "temporaryPassword": password},
        "loginToken": f"doctor_token_{doctor_id}",
    }

from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from config.db import db
from models.schemas import DonorRegister, BloodRequest
from models.database_models import donor_helper

router = APIRouter(prefix="/api/donors", tags=["Blood Mobilization Network"])


class BloodRequestCreate(BaseModel):
    bloodGroup: str
    units: int = Field(ge=1, le=3)
    hospitalName: str
    notes: str = ""
    requesterName: str
    requesterPhone: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class DonorRegistration(BaseModel):
    userId: str
    bloodGroup: str
    phone: str
    isAvailable: bool = True


class DonorStatusUpdate(BaseModel):
    userId: str
    isDonor: bool
    isAvailable: bool

COMPATIBILITY = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["A-", "B-", "AB-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"]
}

@router.post("/register")
async def register_donor(donor: DonorRegistration):
    user_filter = {"_id": ObjectId(donor.userId)} if ObjectId.is_valid(donor.userId) else {"id": donor.userId}
    result = await db.users.update_one(
        user_filter,
        {"$set": {
            "isDonor": True,
            "bloodGroup": donor.bloodGroup,
            "phone": donor.phone,
            "isAvailable": donor.isAvailable,
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "message": "Registered as an available blood donor",
        "status": "active",
        "isDonor": True,
        "bloodGroup": donor.bloodGroup,
        "phone": donor.phone,
        "isAvailable": donor.isAvailable,
    }


@router.patch("/toggle-status")
async def update_donor_status(update: DonorStatusUpdate):
    user_filter = {"_id": ObjectId(update.userId)} if ObjectId.is_valid(update.userId) else {"id": update.userId}
    result = await db.users.update_one(
        user_filter,
        {"$set": {"isDonor": update.isDonor, "isAvailable": update.isAvailable}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "message": "Donor status updated",
        "isDonor": update.isDonor,
        "isAvailable": update.isAvailable,
    }


@router.get("")
async def get_donors(bloodGroup: Optional[str] = Query(default=None)):
    query = {"isDonor": True}
    if bloodGroup:
        query["bloodGroup"] = bloodGroup

    donors = []
    async for donor in db.users.find(query):
        donors.append({
            "id": str(donor["_id"]),
            "username": donor.get("username", ""),
            "bloodGroup": donor.get("bloodGroup", ""),
            "phone": donor.get("phone", ""),
            "address": donor.get("address", ""),
            "distance": donor.get("distance", "Nearby"),
            "available": donor.get("isAvailable", True),
        })
    return donors

@router.get("/match")
async def match_donors(blood_group: str = Query(default="O+")):
    compatible_groups = COMPATIBILITY.get(blood_group, [blood_group])
    cursor = db.donors.find({"blood_group": {"$in": compatible_groups}})
    matched = [donor_helper(d) async for d in cursor]
    return {
        "requested_group": blood_group,
        "accepts_donors_from": compatible_groups,
        "matched_count": len(matched),
        "donors": matched
    }

@router.post("/request")
async def broadcast_request(req: BloodRequest):
    await db.blood_requests.insert_one(req.dict())
    return {
        "status": "broadcasted",
        "message": f"Broadcast sent for {req.blood_group} blood at {req.location}. Compatible donors alerted."
    }

@router.get("/requests")
async def get_active_requests():
    cursor = db.blood_requests.find({"status": "active"}).sort("created_at", -1)
    requests = []
    async for r in cursor:
        requests.append({
            "id": str(r["_id"]),
            "bloodGroup": r.get("bloodGroup", r.get("blood_group", "")),
            "units": r.get("units", r.get("quantity", 1)),
            "hospitalName": r.get("hospitalName", r.get("location", "")),
            "notes": r.get("notes", ""),
            "requesterName": r.get("requesterName", r.get("posted_by", "")),
            "requesterPhone": r.get("requesterPhone", ""),
            "createdAt": r.get("created_at"),
            "distance": r.get("distance", "Nearby"),
        })
    return requests


@router.post("/requests")
async def create_blood_request(req: BloodRequestCreate):
    document = req.model_dump()
    document.update({"status": "active", "created_at": datetime.utcnow()})
    result = await db.blood_requests.insert_one(document)
    return {"success": True, "id": str(result.inserted_id)}


@router.get("/hospital-requests")
async def get_hospital_requests():
    cursor = db.blood_requests.find({
        "$or": [{"isHospitalVerified": True}, {"hospitalName": {"$exists": True}}]
    }).sort("created_at", -1)
    requests = []
    async for r in cursor:
        requests.append({
            "id": str(r["_id"]),
            "bloodGroup": r.get("bloodGroup", r.get("blood_group", "")),
            "units": r.get("units", r.get("quantity", 1)),
            "hospitalName": r.get("hospitalName", r.get("location", "")),
            "notes": r.get("notes", ""),
            "requesterName": r.get("requesterName", ""),
            "requesterPhone": r.get("requesterPhone", ""),
            "createdAt": r.get("created_at"),
            "distance": r.get("distance", "Nearby"),
        })
    return requests
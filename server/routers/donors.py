from fastapi import APIRouter, Query
from config.db import db
from models.schemas import DonorRegister, BloodRequest
from models.database_models import donor_helper

router = APIRouter(prefix="/api/donors", tags=["Blood Mobilization Network"])

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
async def register_donor(donor: DonorRegister):
    doc = donor.dict()
    doc["coordinates"] = [donor.lng, donor.lat]
    await db.donors.insert_one(doc)
    return {"message": "Registered as an available blood donor", "status": "active"}

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
    cursor = db.blood_requests.find().sort("_id", -1).limit(10)
    requests = []
    async for r in cursor:
        r["id"] = str(r["_id"])
        del r["_id"]
        requests.append(r)
    return requests
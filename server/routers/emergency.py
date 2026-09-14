from fastapi import APIRouter, HTTPException, Header
from models.schemas import (
    EmergencyAlert,
    EmergencyContactCreate,
    EmergencyContactUpdate
)
from config.db import db
from datetime import datetime
from bson import ObjectId

router = APIRouter(
    prefix="/api/emergency",
    tags=["Crisis & Emergency Mode"]
)


# --------------------------------
# Get logged-in user's ID
# --------------------------------
async def get_current_user_id(authorization: str | None):

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    if not authorization.startswith("Bearer token_"):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    user_id = authorization.replace("Bearer token_", "", 1)

    try:
        user = await db.users.find_one({
            "_id": ObjectId(user_id)
        })
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID"
        )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user_id


# --------------------------------
# Emergency Alert
# --------------------------------
@router.post("/alert")
async def log_emergency(
    alert: EmergencyAlert,
    authorization: str | None = Header(default=None)
):

    user_id = await get_current_user_id(authorization)

    event = {
        "user_id": user_id,
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
        "location_link": (
            f"https://maps.google.com/?q="
            f"{alert.lat},{alert.lng}"
        )
    }


# --------------------------------
# Add Emergency Contact
# --------------------------------
@router.post("/contacts")
async def add_emergency_contact(
    contact: EmergencyContactCreate,
    authorization: str | None = Header(default=None)
):

    user_id = await get_current_user_id(authorization)

    contact_data = {
        "user_id": user_id,
        "name": contact.name,
        "phone": contact.phone,
        "relation": contact.relation,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }

    result = await db.emergency_contacts.insert_one(contact_data)

    return {
        "message": "Emergency contact added successfully",
        "contact": {
            "id": str(result.inserted_id),
            "name": contact.name,
            "phone": contact.phone,
            "relation": contact.relation,
            "status": "pending"
        }
    }


# --------------------------------
# Get Logged-in User's Contacts
# --------------------------------
@router.get("/contacts")
async def get_emergency_contacts(
    authorization: str | None = Header(default=None)
):

    user_id = await get_current_user_id(authorization)

    contacts = []

    cursor = db.emergency_contacts.find({
        "user_id": user_id
    })

    async for contact in cursor:
        contacts.append({
            "id": str(contact["_id"]),
            "name": contact.get("name", ""),
            "phone": contact.get("phone", ""),
            "relation": contact.get("relation", ""),
            "status": contact.get("status", "pending")
        })

    return contacts


# --------------------------------
# Update Emergency Contact
# --------------------------------
@router.put("/contacts/{contact_id}")
async def update_emergency_contact(
    contact_id: str,
    contact: EmergencyContactUpdate,
    authorization: str | None = Header(default=None)
):

    user_id = await get_current_user_id(authorization)

    update_data = contact.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No changes provided"
        )

    try:
        object_id = ObjectId(contact_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid contact ID"
        )

    result = await db.emergency_contacts.update_one(
        {
            "_id": object_id,
            "user_id": user_id
        },
        {
            "$set": update_data
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Contact not found"
        )

    return {
        "message": "Emergency contact updated successfully"
    }


# --------------------------------
# Delete Emergency Contact
# --------------------------------
@router.delete("/contacts/{contact_id}")
async def delete_emergency_contact(
    contact_id: str,
    authorization: str | None = Header(default=None)
):

    user_id = await get_current_user_id(authorization)

    try:
        object_id = ObjectId(contact_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid contact ID"
        )

    result = await db.emergency_contacts.delete_one(
        {
            "_id": object_id,
            "user_id": user_id
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Contact not found"
        )

    return {
        "message": "Emergency contact deleted successfully"
    }
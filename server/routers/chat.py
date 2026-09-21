from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from pymongo import ReturnDocument

from config.db import db

router = APIRouter(prefix="/api", tags=["Doctor Chat"])
SESSION_COST = 5
DOCTOR_SHARE = 0.70


class ChatMessageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    consultation_id: Optional[str] = None
    doctor_id: Optional[str] = None


class ChatStartRequest(BaseModel):
    doctor_id: Optional[str] = None


class DoctorReplyRequest(BaseModel):
    consultation_id: str
    text: str = Field(min_length=1, max_length=2000)


def token_value(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required. Sign in and send an Authorization: Bearer <token> header.")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token is missing. Sign in again.")
    return token


def object_id(value: str, label: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label}")
    return ObjectId(value)


def serialize_message(message: dict) -> dict:
    return {
        "id": str(message.get("_id", "")),
        "sender": message.get("sender", "user"),
        "text": message.get("text", ""),
        "timestamp": message.get("timestamp"),
        "creditCost": message.get("creditCost", 0),
    }


def serialize_chat(chat: dict) -> dict:
    return {
        "id": str(chat["_id"]),
        "userId": chat.get("userId", ""),
        "doctorId": chat.get("doctorId", ""),
        "doctorName": chat.get("doctorName", "Doctor"),
        "specialization": chat.get("specialization", "General Physician"),
        "status": chat.get("status", "active"),
        "sessionCost": chat.get("sessionCost", SESSION_COST),
        "spentCredits": chat.get("spentCredits", 0),
        "messages": [serialize_message(message) for message in chat.get("messages", [])],
        "updatedAt": chat.get("updated_at"),
    }


async def require_user(authorization: Optional[str]) -> dict:
    token = token_value(authorization)
    if not token.startswith("token_"):
        raise HTTPException(status_code=401, detail="Invalid user token. Sign in again to receive a valid user session.")
    user_id = token.removeprefix("token_")
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=401, detail="Invalid user token. Sign in again to receive a valid user session.")
    user = await db.users.find_one({"_id": object_id(user_id, "user token")})
    if not user or user.get("role", "user") != "user":
        raise HTTPException(status_code=401, detail="Invalid user token. The user session was not found.")
    return user


async def require_doctor(authorization: Optional[str]) -> dict:
    token = token_value(authorization)
    if not token.startswith("doctor_token_"):
        raise HTTPException(status_code=401, detail="Invalid doctor token. Sign in through the doctor portal again.")
    doctor_id = token.removeprefix("doctor_token_")
    if not ObjectId.is_valid(doctor_id):
        raise HTTPException(status_code=401, detail="Invalid doctor token. Sign in through the doctor portal again.")
    doctor = await db.doctors.find_one({"_id": object_id(doctor_id, "doctor token")})
    if not doctor:
        raise HTTPException(status_code=401, detail="Invalid doctor token. The doctor session was not found.")
    return doctor


async def doctor_for_chat(doctor_id: Optional[str]) -> dict:
    query = {"_id": object_id(doctor_id, "doctor ID")} if doctor_id else {"available": True}
    doctor = await db.doctors.find_one(query)
    if not doctor:
        raise HTTPException(status_code=503, detail="No doctor is currently available")
    return doctor


@router.get("/user/wallet")
async def get_user_wallet(authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    if "credits" not in user:
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"credits": 50}})
        user["credits"] = 50
    return {"credits": user.get("credits", 0), "sessionCost": SESSION_COST}


@router.get("/chat/active")
async def get_active_chat(authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    chat = await db.chats.find_one({"userId": str(user["_id"]), "status": "active"}, sort=[("updated_at", -1)])
    return serialize_chat(chat) if chat else None


@router.post("/chat/start")
async def start_chat(request: ChatStartRequest, authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    existing_chat = await db.chats.find_one({"userId": str(user["_id"]), "status": "active"}, sort=[("updated_at", -1)])
    if existing_chat:
        return {"chat": serialize_chat(existing_chat), "credits": user.get("credits", 0), "started": False}

    doctor = await doctor_for_chat(request.doctor_id)
    updated_user = await db.users.find_one_and_update(
        {"_id": user["_id"], "credits": {"$gte": SESSION_COST}},
        {"$inc": {"credits": -SESSION_COST}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated_user:
        raise HTTPException(status_code=402, detail=f"Insufficient Health Credits. A consultation session costs {SESSION_COST} credits.")

    now = datetime.utcnow()
    chat = {
        "userId": str(user["_id"]),
        "doctorId": str(doctor["_id"]),
        "doctorName": doctor.get("name", "Doctor"),
        "specialization": doctor.get("specialization", "General Physician"),
        "messages": [],
        "sessionCost": SESSION_COST,
        "spentCredits": SESSION_COST,
        "doctorShareCredited": False,
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.chats.insert_one(chat)
    chat["_id"] = result.inserted_id
    return {"chat": serialize_chat(chat), "credits": updated_user.get("credits", 0), "started": True}


@router.post("/chat/{consultation_id}/close")
async def close_chat(consultation_id: str, authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    result = await db.chats.update_one(
        {"_id": object_id(consultation_id, "consultation ID"), "userId": str(user["_id"]), "status": "active"},
        {"$set": {"status": "closed", "updated_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Active consultation not found")
    return {"closed": True, "consultationId": consultation_id}


@router.post("/chat/send")
async def send_chat_message(request: ChatMessageRequest, authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    if not request.consultation_id:
        raise HTTPException(status_code=409, detail="Start a consultation session before sending a message.")
    chat = await db.chats.find_one({"_id": object_id(request.consultation_id, "consultation ID"), "userId": str(user["_id"]), "status": "active"})
    if not chat:
        raise HTTPException(status_code=404, detail="Active consultation not found. Start a new session.")
    message = {"sender": "user", "text": request.text.strip(), "timestamp": datetime.utcnow(), "creditCost": 0, "credited": True}
    await db.chats.update_one(
        {"_id": chat["_id"]},
        {"$push": {"messages": message}, "$set": {"updated_at": datetime.utcnow()}},
    )
    chat = await db.chats.find_one({"_id": chat["_id"]})
    return {"chat": serialize_chat(chat), "credits": user.get("credits", 0)}


@router.get("/doctor/chats")
async def get_doctor_chats(authorization: Optional[str] = Header(default=None)):
    doctor = await require_doctor(authorization)
    chats = [serialize_chat(chat) async for chat in db.chats.find({"doctorId": str(doctor["_id"]), "status": "active"}).sort("updated_at", -1)]
    return {"chats": chats, "earnings": doctor.get("earnings", 0), "wallet": doctor.get("wallet", doctor.get("earnings", 0))}


@router.post("/doctor/reply")
async def doctor_reply(request: DoctorReplyRequest, authorization: Optional[str] = Header(default=None)):
    doctor = await require_doctor(authorization)
    chat_id = object_id(request.consultation_id, "consultation ID")
    chat = await db.chats.find_one({"_id": chat_id, "doctorId": str(doctor["_id"]), "status": "active"})
    if not chat:
        raise HTTPException(status_code=404, detail="Active consultation not found")
    share = round(chat.get("sessionCost", SESSION_COST) * DOCTOR_SHARE, 2) if not chat.get("doctorShareCredited") else 0
    reply = {"sender": "doctor", "text": request.text.strip(), "timestamp": datetime.utcnow(), "creditCost": 0, "credited": True}
    update = {"$push": {"messages": reply}, "$set": {"updated_at": datetime.utcnow()}}
    if share:
        update["$set"]["doctorShareCredited"] = True
    await db.chats.update_one({"_id": chat_id}, update)
    if share:
        await db.doctors.update_one({"_id": doctor["_id"]}, {"$inc": {"earnings": share, "wallet": share}})
    updated = await db.chats.find_one({"_id": chat_id})
    return {"chat": serialize_chat(updated), "earned": share}

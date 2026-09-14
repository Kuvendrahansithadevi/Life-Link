from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

from config.db import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=8)
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str = "user"

@router.post("/signup")
async def signup(req: SignupRequest):
    db = get_db()
    
    # MongoDB 'users' collection lo check chesthundhi
    existing = await db.users.find_one({"$or": [{"email": req.email}, {"username": req.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Username or Email already registered")

    user_doc = {
        "username": req.username,
        "email": req.email,
        "password": req.password,
        "address": req.address,
        "lat": req.lat,
        "lng": req.lng,
        "role": "user",
        "isDonor": False,
        "bloodGroup": "O+",
        "created_at": datetime.utcnow()
    }
    res = await db.users.insert_one(user_doc)
    return {
        "token": f"token_{str(res.inserted_id)}",
        "user": {
            "id": str(res.inserted_id),
            "username": req.username,
            "email": req.email,
            "address": req.address,
            "lat": req.lat,
            "lng": req.lng,
            "role": "user",
            "isDonor": False,
            "bloodGroup": "O+"
        }
    }

@router.post("/login")
async def login(req: LoginRequest):
    db = get_db()

    # Hospital/Admin Demo bypass
    if req.role in ["hospital", "admin"]:
        if req.role == "admin" and req.email in ["admin", "admin@lifelink.com"] and req.password in ["admin@108", "Admin@2026"]:
            return {
                "token": "admin_session_token",
                "user": {"id": "admin_1", "username": "System Admin", "role": "admin"}
            }
        if req.role == "hospital" and req.email in ["hospital", "hospital@lifelink.com"] and req.password in ["hospital@108", "Hospital@2026"]:
            return {
                "token": "hospital_session_token",
                "user": {"id": "hosp_1", "username": "City Hospital Staff", "role": "hospital"}
            }

        staff_user = await db.users.find_one({
            "$or": [{"email": req.email}, {"username": req.email}],
            "password": req.password,
            "role": req.role,
        })
        if staff_user:
            return {
                "token": f"token_{str(staff_user['_id'])}",
                "user": {
                    "id": str(staff_user["_id"]),
                    "username": staff_user.get("username", ""),
                    "email": staff_user.get("email", ""),
                    "address": staff_user.get("address", ""),
                    "role": staff_user.get("role", req.role),
                    "hospitalId": staff_user.get("hospitalId"),
                },
            }
        raise HTTPException(status_code=401, detail="Invalid administrator credentials")

    # Normal user check in 'users' collection
    user = await db.users.find_one({
        "$or": [{"email": req.email}, {"username": req.email}],
        "password": req.password
    })
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    return {
        "token": f"token_{str(user['_id'])}",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user.get("email", ""),
            "address": user.get("address", ""),
            "role": user.get("role", "user"),
            "isDonor": user.get("isDonor", False),
            "bloodGroup": user.get("bloodGroup", "O+")
        }
    }
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "lifelink_db")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]


def get_db():
    return db

async def drop_legacy_unique_indexes():
    """Remove uniqueness rules from fields that are no longer globally unique."""
    collections = set(await db.list_collection_names())
    if "users" in collections:
        for index in await db.users.list_indexes().to_list(length=None):
            if index.get("unique") and "username" in index.get("key", {}):
                await db.users.drop_index(index["name"])

    for collection_name in ("hospitals", "staff", "hospital_staff"):
        if collection_name not in collections:
            continue
        collection = db[collection_name]
        for index in await collection.list_indexes().to_list(length=None):
            index_keys = index.get("key", {})
            is_hospital_staff_index = any(key in index_keys for key in ("staff_email", "staff_username"))
            if index["name"] != "_id_" and (index.get("unique") or is_hospital_staff_index):
                await collection.drop_index(index["name"])

async def init_db():
    await db.command("ping")
    await drop_legacy_unique_indexes()
    await db.donors.create_index([("coordinates", "2dsphere")])
    await db.hospitals.create_index([("coordinates", "2dsphere")])
    await db.hospitals.create_index("staff_email", unique=True, sparse=True)
    await db.hospitals.create_index("staff_username", unique=True, sparse=True)
    await db.bookings.create_index("slotKey", unique=True, sparse=True)
    await db.users.create_index("email", unique=True, sparse=True)
    await db.chats.create_index([("userId", 1), ("status", 1)])
    await db.chats.create_index([("doctorId", 1), ("status", 1), ("updated_at", -1)])
    await db.doctors.create_index("email", unique=True)
    await db.users.update_many({"credits": {"$exists": False}}, {"$set": {"credits": 50}})
    await db.doctors.update_one(
        {"email": "doctor@lifelink.com"},
        {"$setOnInsert": {
            "name": "Dr. Ananya Rao",
            "email": "doctor@lifelink.com",
            "password": "Doctor@2026",
            "specialization": "General Physician",
            "earnings": 0,
            "wallet": 0,
            "available": True,
            "created_at": datetime.utcnow(),
        }},
        upsert=True,
    )
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "lifelink_db")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]


def get_db():
    return db

async def init_db():
    await db.command("ping")
    await db.donors.create_index([("coordinates", "2dsphere")])
    await db.hospitals.create_index([("coordinates", "2dsphere")])
    await db.bookings.create_index("slotKey", unique=True, sparse=True)
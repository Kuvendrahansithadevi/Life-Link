import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "lifelink_db")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

async def init_db():
    # Blood donors & hospitals geo query fast ga run avvadaniki 2dsphere indexing
    await db.donors.create_index([("coordinates", "2dsphere")])
    await db.hospitals.create_index([("coordinates", "2dsphere")])
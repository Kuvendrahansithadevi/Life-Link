import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("server/.env")

uri = os.getenv("MONGO_URI")

async def test():
    client = AsyncIOMotorClient(
    uri,
    tls=True,
    serverSelectionTimeoutMS=10000
)

    try:
        result = await client.admin.command("ping")
        print(result)
        print("MOTOR CONNECTION SUCCESS")
    except Exception as e:
        print("MOTOR CONNECTION FAILED")
        print(type(e).__name__)
        print(e)
    finally:
        client.close()

asyncio.run(test())
from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


# Load .env file at project root
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    # For safety, do not hardcode credentials here. Require the env var.
    raise RuntimeError("MONGODB_URI not set in environment or .env file")

_client: Optional[AsyncIOMotorClient] = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URI)
    return _client


def get_db(db_name: str = "ragchatbot") -> AsyncIOMotorDatabase:
    client = get_client()
    return client[db_name]

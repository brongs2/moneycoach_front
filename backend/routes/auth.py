# backend/routes/auth.py
from fastapi import APIRouter, Depends
from backend.db import get_db_connection
from backend.auth import create_token
import uuid

router = APIRouter()

@router.post("/auth/anon")
async def anon(conn=Depends(get_db_connection)):
    username = f"anon_{uuid.uuid4().hex[:10]}"
    row = await conn.fetchrow(
        "INSERT INTO users (username) VALUES ($1) RETURNING id",
        username
    )
    token = create_token(row["id"])
    return {"access_token": token, "token_type": "bearer", "user_id": row["id"]}

# backend/auth.py
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel
import asyncpg

from backend.db import get_db_connection

SECRET_KEY = "CHANGE_ME_TO_A_LONG_RANDOM_SECRET"
ALGORITHM = "HS256"
EXPIRE_DAYS = 30

bearer = HTTPBearer(auto_error=False)

class CurrentUser(BaseModel):
    id: int

def create_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> int:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    sub = payload.get("sub")
    if not sub:
        raise JWTError("missing sub")
    return int(sub)

async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    conn: asyncpg.Connection = Depends(get_db_connection),
) -> CurrentUser:
    if not creds or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        user_id = decode_token(creds.credentials)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # (선택) DB에 실제 유저가 있는지 체크하고 싶으면:
    row = await conn.fetchrow("SELECT id FROM users WHERE id=$1", user_id)
    if not row:
        raise HTTPException(status_code=401, detail="User not found")

    return CurrentUser(id=user_id)

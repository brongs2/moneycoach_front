from fastapi import APIRouter, Depends, HTTPException
import asyncpg

from backend.db import get_db_connection
from backend.auth import get_current_user, CurrentUser
from backend.schemas.schemas import UserCreate, UserOut

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/me", response_model=UserOut)
async def upsert_user_profile(
    payload: UserCreate,
    current_user: CurrentUser = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    """
    현재 로그인 유저의 개인 정보 저장/수정
    저장 컬럼: birth, gender, purpose
    """

    row = await conn.fetchrow(
        """
        UPDATE users
        SET
            birth = $1,
            gender = $2,
            purpose = $3,
            updated_at = NOW()
        WHERE id = $4
        RETURNING
            id,
            username,
            birth,
            gender,
            purpose,
            created_at,
            updated_at
        """,
        payload.birth,
        payload.gender,
        payload.purpose,
        current_user.id,
    )

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return dict(row)

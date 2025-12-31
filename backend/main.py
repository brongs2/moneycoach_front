from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from pydantic import BaseModel
from typing import Optional, Dict, Any
import asyncpg

# ===== 우리가 만든 backend 모듈들 =====
from backend.db import get_db_connection
from backend.auth import get_current_user, CurrentUser
from backend.snapshot import load_user_snapshot
from backend.routes import savings, investments, assets, debts, plans, users
# from backend.mcp_client import mcp_client  # MCP 구현 시 사용

# ==============================
# FastAPI 앱 (⚠️ 하나만!)
# ==============================
app = FastAPI(title="MoneyCoach + Figma MCP API", redirect_slashes=False)

# ==============================
# CORS
# ==============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# Static / Templates
# ==============================
app.mount("/static", StaticFiles(directory="backend/static"), name="static")
templates = Jinja2Templates(directory="backend/templates")

# ==============================
# 라우터 등록 (Money 관련)
# ==============================
app.include_router(savings.router, prefix="/api", tags=["savings"])
app.include_router(investments.router, prefix="/api", tags=["investments"])
app.include_router(assets.router, prefix="/api", tags=["assets"])
app.include_router(debts.router, prefix="/api", tags=["debts"])
app.include_router(plans.router, prefix="/api", tags=["plans"])

app.include_router(users.router, prefix="/api")
# ==============================
# Figma MCP 관련 스키마
# ==============================
class FigmaNodeResponse(BaseModel):
    name: str
    id: str
    type: str
    width: Optional[float] = None
    height: Optional[float] = None
    children: Optional[list] = None


class ScreenshotResponse(BaseModel):
    imageDataUrl: str


# ==============================
# 기본 헬스 체크
# ==============================
@app.get("/")
async def root():
    return {"message": "MoneyCoach Backend Server Running"}

# ==============================
# Figma MCP API
# ==============================
@app.get("/api/figma/metadata", response_model=Dict[str, Any])
async def get_figma_metadata(nodeId: Optional[str] = None):
    try:
        return {
            "node": {
                "name": "Sample Frame",
                "id": nodeId or "current-selection",
                "type": "FRAME",
                "width": 375,
                "height": 812,
                "children": []
            },
            "message": "MCP 통합 필요"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/figma/screenshot", response_model=ScreenshotResponse)
async def get_figma_screenshot(nodeId: Optional[str] = None):
    raise HTTPException(
        status_code=501,
        detail="MCP 통합 필요"
    )


@app.get("/api/figma/design-context")
async def get_figma_design_context(nodeId: Optional[str] = None):
    return {
        "message": "MCP 통합 필요",
        "nodeId": nodeId
    }

# ==============================
# 대시보드 (HTML)
# ==============================
@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    snapshot = await load_user_snapshot(conn, current_user.id)

    plans_data = await conn.fetch(
        "SELECT id, title, description FROM plans WHERE user_id = $1 ORDER BY created_at DESC",
        current_user.id
    )

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "user": current_user,
            "savings": snapshot.get("savings", []),
            "investments": snapshot.get("investments", []),
            "assets": snapshot.get("assets", []),
            "debts": snapshot.get("debts", []),
            "plans": plans_data,
        },
    )

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from pydantic import BaseModel
<<<<<<< HEAD
from typing import Optional, Dict, Any
import asyncpg
=======
from typing import Optional, Dict, Any, List
import httpx
import os
# from mcp_client import mcp_client  # MCP 클라이언트 통합 시 주석 해제
>>>>>>> a5111a1124c5c4befcc6e70c89a556e91077f066

# ===== 우리가 만든 backend 모듈들 =====
from backend.db import get_db_connection
from backend.auth import get_current_user, CurrentUser
from backend.snapshot import load_user_snapshot
from backend.routes import savings, investments, assets, debts, plans
# from backend.mcp_client import mcp_client  # MCP 구현 시 사용

# ==============================
# FastAPI 앱 (⚠️ 하나만!)
# ==============================
app = FastAPI(title="MoneyCoach + Figma MCP API")

# ==============================
# CORS
# ==============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
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


<<<<<<< HEAD
# ==============================
# 기본 헬스 체크
# ==============================
=======
# 사용자 데이터 모델
class PersonalInfo(BaseModel):
    purpose: str
    gender: str
    birthDate: str


class AssetItem(BaseModel):
    id: Optional[str] = None
    type: Optional[str] = None
    amount: float
    unit: str = "만원"
    ownership: Optional[str] = None
    category: Optional[str] = None
    loanAmount: Optional[float] = None
    interestRate: Optional[float] = None
    monthlyPayment: Optional[float] = None


class CategoryData(BaseModel):
    category: str
    categoryId: str
    items: List[AssetItem]
    total: float
    unit: str = "만원"


class SelectedCategory(BaseModel):
    id: str
    name: str


class UserDataSubmission(BaseModel):
    personalInfo: PersonalInfo
    selectedCategories: List[SelectedCategory]
    assets: List[CategoryData]


>>>>>>> a5111a1124c5c4befcc6e70c89a556e91077f066
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

<<<<<<< HEAD
    plans_data = await conn.fetch(
        "SELECT id, title, description FROM plans WHERE user_id = $1 ORDER BY created_at DESC",
        current_user.id
    )
=======
@app.post("/api/user-data")
async def submit_user_data(data: UserDataSubmission):
    """
    사용자가 입력한 모든 데이터를 받아서 저장합니다.
    """
    try:
        # 여기에 데이터베이스 저장 로직을 추가할 수 있습니다
        # 예: database.save_user_data(data)
        
        # 현재는 받은 데이터를 그대로 반환 (확인용)
        return {
            "success": True,
            "message": "데이터가 성공적으로 저장되었습니다.",
            "data": data.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
>>>>>>> a5111a1124c5c4befcc6e70c89a556e91077f066

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

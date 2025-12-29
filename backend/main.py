from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import httpx
import os
# from mcp_client import mcp_client  # MCP 클라이언트 통합 시 주석 해제

app = FastAPI(title="Figma MCP API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FigmaNodeResponse(BaseModel):
    name: str
    id: str
    type: str
    width: Optional[float] = None
    height: Optional[float] = None
    children: Optional[list] = None


class ScreenshotResponse(BaseModel):
    imageDataUrl: str


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


@app.get("/")
async def root():
    return {"message": "Figma MCP API Server"}


@app.get("/api/figma/metadata", response_model=Dict[str, Any])
async def get_figma_metadata(nodeId: Optional[str] = None):
    """
    Figma에서 선택한 프레임의 메타데이터를 가져옵니다.
    nodeId가 제공되지 않으면 현재 선택된 노드를 사용합니다.
    """
    try:
        # MCP 클라이언트를 사용한 실제 호출 (구현 후 주석 해제)
        # result = await mcp_client.get_metadata(nodeId)
        # return {"node": result}
        
        # 임시로 구조만 반환 (실제 MCP 통합 시 위 코드 사용)
        return {
            "node": {
                "name": "Sample Frame",
                "id": nodeId or "current-selection",
                "type": "FRAME",
                "width": 375,
                "height": 812,
                "children": []
            },
            "message": "MCP 통합 필요 - backend/mcp_client.py 구현 후 주석 해제"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/figma/screenshot", response_model=ScreenshotResponse)
async def get_figma_screenshot(nodeId: Optional[str] = None):
    """
    Figma에서 선택한 프레임의 스크린샷을 가져옵니다.
    """
    try:
        # MCP 클라이언트를 사용한 실제 호출 (구현 후 주석 해제)
        # image_data = await mcp_client.get_screenshot(nodeId)
        # return {"imageDataUrl": image_data}
        
        # 임시 응답
        raise HTTPException(
            status_code=501,
            detail="MCP 통합 필요 - backend/mcp_client.py 구현 후 주석 해제"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/figma/design-context")
async def get_figma_design_context(nodeId: Optional[str] = None):
    """
    Figma에서 선택한 프레임의 디자인 컨텍스트를 가져옵니다.
    """
    try:
        # MCP 클라이언트를 사용한 실제 호출 (구현 후 주석 해제)
        # result = await mcp_client.get_design_context(nodeId)
        # return result
        
        return {
            "message": "MCP 통합 필요 - backend/mcp_client.py 구현 후 주석 해제",
            "nodeId": nodeId
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


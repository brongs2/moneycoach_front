# app/api/routes/plans.py

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
import asyncpg
from fastapi import Request
from typing import Optional
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import json
from collections import defaultdict
from datetime import date

from backend.db import get_db_connection
from backend.schemas.schemas import (
    PlanCreate, PlanOut, PlanUpdate,
    RevenueCreate, RevenueOut, RevenueUpdate,
    ExpenseCreate, ExpenseOut, ExpenseUpdate,
    TaxCreate, TaxOut, TaxUpdate,
)
from backend.schemas.schemas import PlanPriority
from backend.schemas.simulation import SimulationRequest, SimulationDefault

from backend.simulation import run_simulation, get_yearly_summary
from backend.snapshot import load_user_snapshot
from backend.auth import get_current_user, CurrentUser  # 가정

router = APIRouter(prefix="/plans", tags=["plans"])

templates = Jinja2Templates(directory="backend/templates")


def _to_rate_pct(v) -> float:
    """DB/요청에 저장된 % 값을 연간 rate(소수)로 변환. None이면 0."""
    try:
        return float(v or 0.0) / 100.0
    except (TypeError, ValueError):
        return 0.0


def _real_return(roi_pct, dividend_pct, inflation_pct) -> float:
    """
    실질 수익률(연간, 소수):
      real = ((1+roi)*(1+dividend))/(1+inflation) - 1
    (roi/dividend/inflation은 %로 들어온다고 가정)
    """
    roi = _to_rate_pct(roi_pct)
    div = _to_rate_pct(dividend_pct)
    inf = _to_rate_pct(inflation_pct)

    # inflation이 -100%에 가까운 이상값이면 방어
    denom = (1.0 + inf)
    if denom <= 0:
        denom = 1.0

    return ((1.0 + roi) * (1.0 + div)) / denom - 1.0

LIFESTYLE_RULES = {
    "비상금":        ("EMERGENCY", "SAVINGS", 40),
    "현금확보":      ("CASH",      "SAVINGS", 40),
    "안전자산":      ("SAFETY",    "SAVINGS", 30),

    "공격투자":      ("INVEST",    "INVEST", 40),
    "욜로":          ("SPEND",    "SPEND", 30),
    "사치":          ("INVEST",    "INVEST", 30),

    "빚청산":        ("DEBT_PAYDOWN", "DEBT", 40),

    "은퇴준비":      ("SAVINGS", "SAVINGS", 20),
    "내집마련":      ("SAVINGS",       "SAVINGS", 20),
    "밸런스":        ("SAVINGS",   "SAVINGS", 20),
    "균형적인":      ("SAVINGS",   "SAVINGS", 20),
    "목표달성":      ("SAVINGS",       "SAVINGS", 20),
}

DEFAULT_ALLOCATION = {"bucket": "SAVINGS", "type": "SAVINGS", "weight": 100}
def normalize_to_1(weights: dict[str, float]) -> dict[str, float]:
    total = sum(weights.values())
    if total <= 0:
        return {"SAVINGS": 1.0}

    scaled = {k: v / total for k, v in weights.items()}

    # 부동소수점 오차 보정
    diff = 1.0 - sum(scaled.values())
    if abs(diff) > 1e-9:
        k_max = max(scaled, key=scaled.get)
        scaled[k_max] += diff

    return scaled

def lifestyle_to_priority(lifestyles: list[str]) -> dict:
    type_weights = defaultdict(float)
    bucket_choice = None

    for name in lifestyles:
        rule = LIFESTYLE_RULES.get(name)
        if not rule:
            continue

        bucket, type_, w = rule
        bucket_choice = bucket_choice or bucket
        type_weights[type_] += float(w)

    # 아무 매칭도 없으면 기본
    if not type_weights:
        return {"allocations": [DEFAULT_ALLOCATION]}

    normalized = normalize_to_1(type_weights)
    bucket_choice = bucket_choice or "BASE"

    allocations = [
        {
            "bucket": bucket_choice,
            "type": type_,
            "weight": weight,   # ✅ 0~1 float
        }
        for type_, weight in normalized.items()
        if weight > 0
    ]

    if not allocations:
        allocations = [DEFAULT_ALLOCATION]

    return {"allocations": allocations}
@router.post("/", response_model=PlanOut)
async def create_plan(
    payload: PlanCreate,
    current_user: CurrentUser = Depends(get_current_user),
    conn = Depends(get_db_connection),
):
    title = payload.title
    description = payload.description

    roi = getattr(payload, "roi", None)
    dividend = getattr(payload, "dividend", None)
    inflation = getattr(payload, "inflation", None)

    # ✅ lifestyle → priority 변환
    priority_obj = lifestyle_to_priority(payload.lifestyle)   # dict: {"allocations":[...]}

    async with conn.transaction():
        row = await conn.fetchrow(
            """
            INSERT INTO plans
                (user_id, title, roi, dividend, inflation, description, priority)
            VALUES
                ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, user_id, title, roi, dividend, inflation, description, priority, created_at, updated_at
            """,
            current_user.id,
            title,
            roi,
            dividend,
            inflation,
            description,
            json.dumps(priority_obj),         # ✅ priority JSON 저장
        )
    if row["priority"]:
        priority_obj = json.loads(row["priority"]) 
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "title": row["title"],
        "roi": row["roi"],
        "dividend": row["dividend"],
        "inflation": row["inflation"],
        "description": row["description"],
        "priority": priority_obj,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }




@router.get("/{plan_id}")
async def get_plan_details(
    plan_id: int,
    request: Request,
    view: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    # 1. Plan 조회
    plan = await conn.fetchrow(
        """
        SELECT id, user_id, title, roi, dividend, inflation, description, priority, 
               retirement_year, expected_death_year, created_at, updated_at
        FROM plans
        WHERE user_id = $1 AND id = $2
        """,
        current_user.id,
        plan_id,
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # 2. Priority 처리
    priority = plan["priority"]
    if isinstance(priority, str):
        priority = json.loads(priority)
    plan_priority = PlanPriority(**priority)

    # 3. 데이터 조회 (Taxes 추가)
    revenues = await conn.fetch(
        "SELECT category, amount, frequency, start_date, end_date FROM revenues WHERE plan_id = $1 ORDER BY created_at DESC",
        plan_id,
    )
    expenses = await conn.fetch(
        "SELECT category, amount, frequency, start_date, end_date FROM expenses WHERE plan_id = $1 ORDER BY created_at DESC",
        plan_id,
    )
    # ✅ 추가: 세금 설정 데이터 조회
    taxes = await conn.fetch(
        "SELECT category, rate, frequency FROM taxes WHERE plan_id = $1 ORDER BY created_at DESC",
        plan_id,
    )

    # 4. 시뮬레이션 실행 (스냅샷에 taxes 추가)
    snapshot = await load_user_snapshot(conn, current_user.id)
    snapshot["revenues"] = [dict(r) for r in revenues]
    snapshot["expenses"] = [dict(r) for r in expenses]
    snapshot["taxes"] = [dict(r) for r in taxes]  # ✅ 스냅샷에 포함

    default_interest = 0.02
    sim_req = SimulationRequest(
        plan_id=plan["id"],
        default_value=SimulationDefault(
            default_interest=default_interest,
            default_roi=plan["roi"],
            default_dividend=plan["dividend"],
            inflation=plan["inflation"]
        ),
        extra_monthly_spend=0.0,
        priority=plan_priority,
        retirement_year=plan["retirement_year"],
        expected_death_year=plan["expected_death_year"]
    )
    sim_result = run_simulation(snapshot, sim_req, start_date=date.today())

    # ✅ 5. 연도별 집계 데이터 생성
    summary = get_yearly_summary(sim_result)

    # 응답 공통 데이터 (HTML/JSON 공유)
    response_data = {
        "request": request,
        "plan": plan,
        "revenues": [dict(r) for r in revenues],
        "expenses": [dict(r) for r in expenses],
        "taxes_input": [dict(r) for r in taxes],  # ✅ 입력된 세금 설정
        "interest_rate": default_interest,
        "labels": summary["labels"],
        "net_worth": summary["net_worth"],
        "net_cash_flow": summary["net_cash_flow"],
        "total_repayment": summary["total_repayment"],
        "total_savings": summary["total_savings"],
        "total_investments": summary["total_investments"],
        "total_debts": summary["total_debts"],
        "total_assets": summary["total_assets"],
        "total_income": summary["total_income"],
        "total_spend": summary["total_spend"],
        "total_dividend": summary["total_dividend"],
        "total_deposit": summary["total_deposit"],
        "total_tax": summary["total_tax"],  # ✅ 시뮬레이션 결과로 나간 세금 리스트
        "priority": plan_priority,
        "retirement_year": plan["retirement_year"],
        "expected_death_year": plan["expected_death_year"],
    }

    # 6. 응답 처리 (HTML)
    if view == "html":
        return templates.TemplateResponse("plan_detail.html", response_data)

    # 7. 응답 처리 (JSON)
    # JSON 응답에서 request 객체는 제외하고 반환
    response_data.pop("request")
    return response_data

@router.patch("/{plan_id}", response_model=PlanOut)
async def update_plan(
    plan_id: int,
    payload: PlanUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    # 1. 기존 데이터 조회
    current = await conn.fetchrow(
        "SELECT * FROM plans WHERE id = $1 AND user_id = $2", 
        plan_id, current_user.id
    )
    if not current:
        raise HTTPException(status_code=404, detail="Plan not found")

    # 2. 유저가 보낸 데이터만 추출 (Pydantic v2 model_dump)
    update_data = payload.model_dump(exclude_unset=True)

    # 3. 데이터 병합 (JSONB이므로 dict 상태 그대로 유지)
    final_data = dict(current)
    final_data.update(update_data)
    print(final_data["priority"])
    # 4. DB 업데이트 (JSONB 컬럼에는 dict를 직접 전달)
    async with conn.transaction():
        row = await conn.fetchrow(
            """
            UPDATE plans
            SET
                title = $1,
                description = $2,
                roi = $3,
                dividend = $4,
                inflation = $5,
                retirement_year = $6,
                expected_death_year = $7,
                priority = $8,  -- ✅ JSONB 컬럼이므로 dict가 그대로 들어갑니다.
                updated_at = now()
            WHERE id = $9 AND user_id = $10
            RETURNING *
            """,
            final_data["title"],
            final_data["description"],
            final_data["roi"],
            final_data["dividend"],
            final_data["inflation"],
            final_data["retirement_year"],
            final_data["expected_death_year"],
            final_data["priority"], # dict 객체 전달
            plan_id,
            current_user.id
        )

    # 5. 반환 (JSONB는 asyncpg가 조회 시 자동으로 dict로 변환해서 가져옴)
    res_dict = dict(row)

    # 2. ✅ 핵심: priority가 문자열로 넘어왔다면 dict로 강제 변환
    # JSONB 컬럼이라도 드라이버 설정에 따라 문자열로 넘어올 수 있습니다.
    if isinstance(res_dict.get("priority"), str):
        try:
            res_dict["priority"] = json.loads(res_dict["priority"])
        except Exception:
            # 변환 실패 시 기존 값 유지 또는 빈 딕셔너리
            pass

    return res_dict

# ----- Plan 삭제 -----
@router.delete("/{plan_id}", status_code=204)
async def delete_plan(
    plan_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    conn=Depends(get_db_connection),
):
    async with conn.transaction():
        result = await conn.execute(
            """
            DELETE FROM plans
            WHERE id = $1 AND user_id = $2
            """,
            plan_id,
            current_user.id,
        )

    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="plan not found")

    return Response(status_code=204)


# ==========================
# Plan 상세 조회 (get_plan_details) 수정
# ==========================
@router.get("/{plan_id}")
async def get_plan_details(
    plan_id: int,
    request: Request,
    view: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    # 1. Plan 조회
    plan = await conn.fetchrow(
        """
        SELECT id, user_id, title, roi, dividend, inflation, description, priority, 
               retirement_year, expected_death_year, created_at, updated_at
        FROM plans
        WHERE user_id = $1 AND id = $2
        """,
        current_user.id,
        plan_id,
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # 2. Priority 처리
    priority = plan["priority"]
    if isinstance(priority, str):
        priority = json.loads(priority)
    plan_priority = PlanPriority(**priority)

    # 3. 수입/지출 조회 (time_range 제거, start_date/end_date 추가)
    revenues = await conn.fetch(
        "SELECT category, amount, frequency, start_date, end_date FROM revenues WHERE plan_id = $1 ORDER BY created_at DESC",
        plan_id,
    )
    expenses = await conn.fetch(
        "SELECT category, amount, frequency, start_date, end_date FROM expenses WHERE plan_id = $1 ORDER BY created_at DESC",
        plan_id,
    )

    # 4. 시뮬레이션 실행
    snapshot = await load_user_snapshot(conn, current_user.id)
    snapshot["revenues"] = [dict(r) for r in revenues] # dict 변환 권장
    snapshot["expenses"] = [dict(r) for r in expenses]

    sim_req = SimulationRequest(
        plan_id=plan["id"],
        default_value=SimulationDefault(
            default_interest=0.02,
            default_roi=plan["roi"],
            default_dividend=plan["dividend"],
            inflation=plan["inflation"]
        ),
        extra_monthly_spend=0.0,
        priority=plan_priority,
        retirement_year=plan["retirement_year"],
        expected_death_year=plan["expected_death_year"]
    )
    sim_result = run_simulation(snapshot, sim_req, start_date=date.today())

    # 5. 연도별 집계 데이터 생성
    summary = get_yearly_summary(sim_result)

    # 6. 응답 처리 (HTML)
    if view == "html":
        return templates.TemplateResponse(
            "plan_detail.html",
            {
                "request": request,
                "plan": plan,
                "revenues": [dict(r) for r in revenues],
                "expenses": [dict(r) for r in expenses],
                "labels": summary["labels"],
                "net_worth": summary["net_worth"],
                "net_cash_flow": summary["net_cash_flow"],
                "total_repayment": summary["total_repayment"],
                "total_savings": summary["total_savings"],
                "total_investments": summary["total_investments"],
                "total_debts": summary["total_debts"],
                "total_assets": summary["total_assets"],
                "priority": plan_priority,
                "retirement_year": plan["retirement_year"],
                "expected_death_year": plan["expected_death_year"],
            },
        )

    # 7. 응답 처리 (JSON)
    return {
        "id": plan["id"],
        "user_id": plan["user_id"],
        "title": plan["title"],
        "roi": plan["roi"],
        "dividend": plan["dividend"],
        "inflation": plan["inflation"],
        "description": plan["description"],
        "priority": plan_priority,
        "created_at": plan["created_at"],
        "updated_at": plan["updated_at"],
        "revenues": [dict(r) for r in revenues],
        "expenses": [dict(r) for r in expenses],
        "labels": summary["labels"],
        "net_worth": summary["net_worth"],
        "net_cash_flow": summary["net_cash_flow"],
        "total_repayment": summary["total_repayment"],
        "total_savings": summary["total_savings"],
        "total_investments": summary["total_investments"],
        "total_debts": summary["total_debts"],
        "total_assets": summary["total_assets"],
        "retirement_year": plan["retirement_year"],
        "expected_death_year": plan["expected_death_year"],
    }


# ==========================
# Plan 하위: Revenues (CRUD에서 time_range 제거)
# ==========================

@router.post("/{plan_id}/revenues", response_model=RevenueOut)
async def create_revenue(
    plan_id: int,
    payload: RevenueCreate,
    conn=Depends(get_db_connection),
):
    async with conn.transaction():
        row = await conn.fetchrow(
            """
            INSERT INTO revenues
                (plan_id, category, amount, frequency, start_date, end_date)
            VALUES
                ($1, $2, $3, $4, $5, $6)
            RETURNING
                id, plan_id, category, amount, frequency, start_date, end_date, created_at, updated_at
            """,
            plan_id,
            payload.category,
            payload.amount,
            payload.frequency,
            payload.start_date,
            payload.end_date,
        )
    return dict(row)

# ... list_revenues 에서도 SELECT 절에 start_date, end_date만 남기고 time_range 제거 ...

@router.patch("/revenues/{revenue_id}", response_model=RevenueOut)
async def update_revenue(
    revenue_id: int,
    payload: RevenueUpdate,
    conn=Depends(get_db_connection),
):
    
    # 1. 기존 데이터 조회
    current = await conn.fetchrow("SELECT * FROM revenues WHERE id = $1", revenue_id)
    if not current:
        raise HTTPException(status_code=404, detail="revenue not found")

    # 2. Pydantic v2 model_dump 사용 (유저가 입력한 값만 추출)
    update_dict = payload.model_dump(exclude_unset=True)
    
    # 🔍 디버깅용 로그 (서버 터미널에서 확인용)
    # print(f"DEBUG: 유저 요청 데이터 -> {update_dict}")

    # 3. 데이터 병합
    final_data = dict(current)
    final_data.update(update_dict)
    # 4. DB 업데이트 실행 (NULL 업데이트 강제 수행)
    async with conn.transaction():
        # SQL 문에서 특정 값이 None(null)인 경우도 포함하여 업데이트
        row = await conn.fetchrow(
            """
            UPDATE revenues
            SET
                category   = $1,
                amount     = $2,
                frequency  = $3,
                start_date = $4,
                end_date   = $5,  -- 이 값이 None이면 DB에는 NULL이 들어갑니다.
                updated_at = now()
            WHERE id = $6
            RETURNING id, plan_id, category, amount, frequency, start_date, end_date, created_at, updated_at
            """,
            final_data["category"],
            final_data["amount"],
            final_data["frequency"],
            final_data["start_date"],
            final_data["end_date"], # 여기서 None이 제대로 전달되는지가 핵심
            revenue_id,
        )

    # 5. 반환하기 전 데이터 확인
    # print(f"DEBUG: 업데이트 후 결과 -> {dict(row)}")
    return dict(row)
# Expense 관련 함수들도 위와 동일한 방식으로 (time_range 제거, 날짜 추가) 수정하시면 됩니다.

# ==========================
# Plan 하위: Expenses
# ==========================

@router.post("/{plan_id}/expenses", response_model=ExpenseOut)
async def create_expense(
    plan_id: int,
    payload: ExpenseCreate,
    conn=Depends(get_db_connection),
):
    async with conn.transaction():
        row = await conn.fetchrow(
            """
            INSERT INTO expenses
                (plan_id, category, amount, frequency, start_date, end_date)
            VALUES
                ($1, $2, $3, $4, $5, $6)
            RETURNING
                id, plan_id, category, amount, frequency, start_date, end_date, created_at, updated_at
            """,
            plan_id,
            payload.category,
            payload.amount,
            payload.frequency,
            payload.start_date,
            payload.end_date,
        )

    return dict(row)


@router.get("/{plan_id}/expenses", response_model=list[ExpenseOut])
async def list_expenses(
    plan_id: int,
    conn=Depends(get_db_connection),
):
    rows = await conn.fetch(
        """
        SELECT
            id, plan_id, category, amount, frequency, start_date, end_date, created_at, updated_at
        FROM expenses
        WHERE plan_id = $1
        ORDER BY created_at DESC
        """,
        plan_id,
    )
    return [dict(row) for row in rows]


# ==========================
# Plan 하위: Revenues (수정됨)
# ==========================

@router.patch("/revenues/{revenue_id}", response_model=RevenueOut)
async def update_revenue(
    revenue_id: int,
    payload: RevenueUpdate,
    conn=Depends(get_db_connection),
):
    print(f"--- update_revenue 호출됨 (ID: {revenue_id}) ---") # 함수 진입 확인용
    
    current = await conn.fetchrow("SELECT * FROM revenues WHERE id = $1", revenue_id)
    if not current:
        raise HTTPException(status_code=404, detail="revenue not found")

    # model_dump를 사용하여 유저가 명시적으로 보낸 값만 추출
    update_dict = payload.model_dump(exclude_unset=True)
    print(f"DEBUG update_dict: {update_dict}") # null(None)이 포함되어 있는지 확인

    final_data = dict(current)
    final_data.update(update_dict)

    async with conn.transaction():
        row = await conn.fetchrow(
            """
            UPDATE revenues
            SET
                category   = $1,
                amount     = $2,
                frequency  = $3,
                start_date = $4,
                end_date   = $5,
                updated_at = now()
            WHERE id = $6
            RETURNING id, plan_id, category, amount, frequency, start_date, end_date, created_at, updated_at
            """,
            final_data["category"],
            final_data["amount"],
            final_data["frequency"],
            final_data["start_date"],
            final_data["end_date"], # 유저가 null을 보냈다면 여기서 None이 전달됨
            revenue_id,
        )

    return dict(row)


# ==========================
# Plan 하위: Expenses (수정됨)
# ==========================

@router.patch("/expenses/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    conn=Depends(get_db_connection),
):
    print(f"--- update_expense 호출됨 (ID: {expense_id}) ---")
    
    current = await conn.fetchrow("SELECT * FROM expenses WHERE id = $1", expense_id)
    if not current:
        raise HTTPException(status_code=404, detail="expense not found")

    # ✅ Expense도 동일하게 model_dump 로직 적용 (null 업데이트 가능하게)
    update_dict = payload.model_dump(exclude_unset=True)
    
    final_data = dict(current)
    final_data.update(update_dict)

    async with conn.transaction():
        row = await conn.fetchrow(
            """
            UPDATE expenses
            SET
                category   = $1,
                amount     = $2,
                frequency  = $3,
                start_date = $4,
                end_date   = $5,
                updated_at = now()
            WHERE id = $6
            RETURNING id, plan_id, category, amount, frequency, start_date, end_date, created_at, updated_at
            """,
            final_data["category"],
            final_data["amount"],
            final_data["frequency"],
            final_data["start_date"],
            final_data["end_date"],
            expense_id,
        )

    return dict(row)
# ==========================
# Plan 하위: Taxes
# ==========================

@router.post("/{plan_id}/taxes", response_model=TaxOut)
async def create_tax(
    plan_id: int,
    payload: TaxCreate,
    conn=Depends(get_db_connection),
):
    category = payload.category

    async with conn.transaction():
        row = await conn.fetchrow(
        """
        INSERT INTO taxes (plan_id, category, rate, frequency)
        VALUES ($1, $2, $3, $4)
        RETURNING id, plan_id, category, rate, frequency, created_at, updated_at
        """,
        plan_id,
        payload.category,
        payload.rate,
        payload.frequency,
    )

    return {
        "id": row["id"],
        "plan_id": row["plan_id"],
        "rate": row["rate"],
        "frequency": row["frequency"],
        "category": row["category"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


@router.get("/{plan_id}/taxes", response_model=list[TaxOut])
async def list_taxes(
    plan_id: int,
    conn=Depends(get_db_connection),
):
    rows = await conn.fetch(
        """
        SELECT
            id,
            plan_id,
            category,
            created_at,
            updated_at
        FROM taxes
        WHERE plan_id = $1
        ORDER BY created_at DESC
        """,
        plan_id,
    )

    return [
        {
            "id": row["id"],
            "plan_id": row["plan_id"],
            "category": row["category"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        for row in rows
    ]


@router.patch("/taxes/{tax_id}", response_model=TaxOut)
async def update_tax(
    tax_id: int,
    payload: TaxUpdate,
    conn=Depends(get_db_connection),
):
    current = await conn.fetchrow(
        """
        SELECT
            id,
            plan_id,
            category,
            created_at,
            updated_at
        FROM taxes
        WHERE id = $1
        """,
        tax_id,
    )

    if not current:
        raise HTTPException(status_code=404, detail="tax not found")

    new_category = payload.category if payload.category is not None else current["category"]

    async with conn.transaction():
        row = await conn.fetchrow(
            """
            UPDATE taxes
            SET
                category   = $1,
                updated_at = now()
            WHERE id = $2
            RETURNING
                id,
                plan_id,
                category,
                created_at,
                updated_at
            """,
            new_category,
            tax_id,
        )

    return {
        "id": row["id"],
        "plan_id": row["plan_id"],
        "category": row["category"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


@router.delete("/taxes/{tax_id}", status_code=204)
async def delete_tax(
    tax_id: int,
    conn=Depends(get_db_connection),
):
    async with conn.transaction():
        result = await conn.execute(
            """
            DELETE FROM taxes
            WHERE id = $1
            """,
            tax_id,
        )

    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="tax not found")

    return Response(status_code=204)

// src/types/plan.ts

// ===== Goal =====
export interface PlanGoalData {
  age: number
  assetType: string        // '현재 자산' | '저축' ... 처럼 나중에 union으로 바꿔도 됨
  multiplier: number       // 1,2,3,5,10 ...
  action: string           // '확장 시키겠습니다' ...
}

// ===== Income =====
export interface PlanIncomeItem {
  id: string
  category: string         // '직장' | '사업' | ...
  amount: number
}

export interface PlanIncomeData {
  items: PlanIncomeItem[]
  total: number
  unit: '만원/년'
}

// ===== Outcome(Expense) =====
export interface PlanOutcomeItem {
  id: string
  category: string         // '생활비' | ...
  amount: number
}

export interface PlanOutcomeData {
  items: PlanOutcomeItem[]
  total: number
  unit: '만원/년' // 나중에 월로 바꾸면 '만원/월' 추가 가능
}

// ===== Tax =====
export interface PlanTaxRateData {
  taxRate: number // 예: 0~100 또는 0~1 중 너가 정한 기준 (통일!)
}


export interface PlanLifestyleData {
   preferences: string[]
  // lifestyle 관련 필드 있으면 여기에 추가
}

// ===== Aggregated State (App에서 모으는 용도) =====
export interface PlanState {
  goal?: PlanGoalData
  income?: PlanIncomeData
  outcome?: PlanOutcomeData
  taxRate?: PlanTaxRateData
  lifestyle?: PlanLifestyleData
}

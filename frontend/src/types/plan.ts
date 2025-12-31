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
export interface PlantaxRateItem {
  taxCategory: string
  taxRate: number
}
export interface PlanTaxRateData {
  items: PlantaxRateItem[]
}


export interface PlanLifestyleData {
   preferences: string[]
  // lifestyle 관련 필드 있으면 여기에 추가
}

// ===== Simulation Info =====
export interface PlanSimulationInfoData {
  investmentReturn: number  // 투자 수익률 (%)
  interestRate: number      // 금리 (%)
  inflation: number         // 인플레이션 (%)
}

// ===== Aggregated State (App에서 모으는 용도) =====
export interface PlanState {
  goal?: PlanGoalData
  simulationInfo?: PlanSimulationInfoData
  income?: PlanIncomeData
  outcome?: PlanOutcomeData
  taxRate?: PlanTaxRateData
  lifestyle?: PlanLifestyleData
}


/// plan detail
export type Frequency = 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY'

export type RevenueCategory = 'INCOME' // 필요하면 enum 확장
export type ExpenseCategory = 'EXPENSE' // 필요하면 enum 확장

export type PriorityAllocation = {
  bucket: string
  type: 'SAVINGS' | 'INVEST' | 'DEBT' | string
  weight: number // 서버가 0~1이면 number, 0~100이면 number
}

export type PlanPriority = {
  allocations: PriorityAllocation[]
}

export type PlanRevenue = {
  id: number
  plan_id: number
  category: RevenueCategory | string
  amount: number
  frequency: Frequency
  start_date: string
  end_date: string
  created_at: string
  updated_at: string | null
}

export type PlanExpense = {
  id: number
  plan_id: number
  category: ExpenseCategory | string
  amount: number
  frequency: Frequency
  start_date: string
  end_date: string
  created_at: string
  updated_at: string | null
}

export type PlanDetailResponse = {
  id: number
  user_id: number
  title: string
  description: string | null
  roi: number
  dividend: number
  inflation: number
  priority: PlanPriority

  created_at: string
  updated_at: string | null

  revenues: PlanRevenue[]
  expenses: PlanExpense[]

  labels: string[] // summary["labels"]가 문자열 배열이라고 가정
  net_worth: number
  net_cash_flow: number
  total_repayment: number
  total_savings: number
  total_investments: number
  total_debts: number
  total_assets: number

  retirement_year: number
  expected_death_year: number
}
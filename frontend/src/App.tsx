// App.tsx (정리본: plan submit + asset setup + page routing)
import React, { useState, useEffect } from 'react'
import SetupPersonalInfo from './pages/SetupPersonalInfo'
import SetupSelectAssets from './pages/SetupSelectAssets'
import MyAssetPage from './pages/MyAssetPage'
import SetupSavings from './pages/SetupSavings'
import SetupInvestment from './pages/SetupInvestment'
import SetupRealAssets from './pages/SetupRealAssets'
import SetupDebt from './pages/SetupDebt'
import AssetDetailPage from './pages/AssetDetailPage'
import MainPage from './pages/MainPage'
import PlanSetGoal from './pages/PlanSetGoal'
import PlanIncome from './pages/PlanIncome'
import PlanOutcome from './pages/PlanOutcome'
import PlanTaxRate from './pages/PlanTaxRate'
import PlanLifestyle from './pages/PlanLifestyle'
import './App.css'

import type {
  PlanState,
  PlanGoalData,
  PlanIncomeData,
  PlanOutcomeData,
  PlanTaxRateData,
  PlanLifestyleData,
} from './types/plan'

// =====================
// Types
// =====================
type Page =
  | 'personalInfo'
  | 'selectAssets'
  | 'myAssetPage'
  | 'setupSavings'
  | 'setupInvestment'
  | 'setupRealAssets'
  | 'setupDebt'
  | 'assetDetail'
  | 'mainPage'
  | 'planSetGoal'
  | 'planIncome'
  | 'planOutcome'
  | 'planTaxRate'
  | 'planLifestyle'

interface PersonalInfo {
  purpose: string
  gender: string
  birthDate: string
}

// =====================
// App
// =====================
function App() {
  const API = 'http://localhost:8000/api'

  const [currentPage, setCurrentPage] = useState<Page>('personalInfo')
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null)

  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [assetData, setAssetData] = useState<Record<string, any>>({})
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<string | null>(null)
  const [lastSetupPage, setLastSetupPage] = useState<Page | null>(null)

  const [planState, setPlanState] = useState<PlanState>({})

  // 최초 로드
  useEffect(() => {
    loadAll(API, setAssetData, setSelectedAssets).catch(console.error)
  }, [])

  // ---------------------
  // Setup Flow handlers
  // ---------------------
  const handlePersonalInfoNext = (info: PersonalInfo) => {
    setPersonalInfo(info)
    setCurrentPage('selectAssets')
  }

  const handleSelectAssetsBack = () => setCurrentPage('personalInfo')

  const handleSelectAssetsNext = (assets: Set<string>) => {
    setSelectedAssets(assets)
    setCurrentPage('myAssetPage')
  }

  const handleMyAssetPageInput = () => {
    const assetOrder = ['savings', 'investment', 'tangible', 'debt']
    const nextAssetToInput = assetOrder.find(
      (asset) => selectedAssets.has(asset) && (!assetData[asset] || assetData[asset].total === 0)
    )

    if (!nextAssetToInput) return

    if (nextAssetToInput === 'savings') {
      setCurrentPage('setupSavings')
      setLastSetupPage('setupSavings')
    } else if (nextAssetToInput === 'investment') {
      setCurrentPage('setupInvestment')
      setLastSetupPage('setupInvestment')
    } else if (nextAssetToInput === 'tangible') {
      setCurrentPage('setupRealAssets')
      setLastSetupPage('setupRealAssets')
    } else if (nextAssetToInput === 'debt') {
      setCurrentPage('setupDebt')
      setLastSetupPage('setupDebt')
    }
  }

  const handleSetupComplete = async (assetType: string, data: any) => {
    try {
      await saveAssetByType(API, assetType, data)
      await loadAll(API, setAssetData, setSelectedAssets)
      setCurrentPage('myAssetPage')
    } catch (e) {
      console.error('저장 실패', e)
      setCurrentPage('myAssetPage')
    }
  }

  const handleAssetClick = (assetType: string) => {
    setSelectedAssetForDetail(assetType)
    setCurrentPage('assetDetail')
  }

  const handleGoToMain = async () => {
    // ✅ 여기서는 기존 너의 자산/개인정보 저장 로직 유지
    try {
      if (personalInfo) {
        const genderMap: Record<string, string> = { 남성: 'MALE', 여성: 'FEMALE' }
        const birth = personalInfo.birthDate ? personalInfo.birthDate.replace(/\//g, '-') : null

        await postJson(`${API}/users/me`, {
          birth,
          gender: genderMap[personalInfo.gender] ?? personalInfo.gender ?? null,
          purpose: personalInfo.purpose || '',
        })
      }

      // 자산 bulk 전송(필요한 것만)
      if (selectedAssets.has('savings')) {
        const savingsCategoryMap: Record<string, string> = {
          '일반 예금': 'DEPOSIT',
          적금: 'SAVING',
          청약: 'SUBSCRIPTION',
          기타: 'ETC',
        }
        await postJson(`${API}/savings/bulk`, {
          items: (assetData.savings?.items ?? [])
            .map((it: any) => ({
              category: savingsCategoryMap[it.category] ?? it.category,
              amount: Number(it.amount ?? 0),
            }))
            .filter((x: any) => x.amount > 0),
        })
      }

      if (selectedAssets.has('investment')) {
        const investmentCategoryMap: Record<string, string> = {
          주식: 'STOCK',
          부동산: 'REAL_ESTATE',
          암호화폐: 'CRYPTO',
          기타: 'ETC',
        }
        await postJson(`${API}/investments/bulk`, {
          items: (assetData.investment?.items ?? [])
            .map((it: any) => ({
              category: investmentCategoryMap[it.category] ?? it.category,
              amount: Number(it.amount ?? 0),
            }))
            .filter((x: any) => x.amount > 0),
        })
      }

      if (selectedAssets.has('tangible')) {
        const assetCategoryMap: Record<string, string> = {
          집: 'HOUSE',
          오피스텔: 'OFFICETEL',
          상가: 'STORE',
          기타: 'ETC',
        }
        await postJson(`${API}/assets/bulk`, {
          items: (assetData.tangible?.items ?? []).map((it: any) => ({
            category: assetCategoryMap[it.category] ?? it.category,
            amount: Number(it.amount ?? 0),
            loan_amount: Number(it.loan_amount ?? 0),
            interest_rate: Number(it.interest_rate ?? 0),
            repay_amount: Number(it.repay_amount ?? 0),
          })),
        })
      }

      if (selectedAssets.has('debt')) {
        const debtCategoryMap: Record<string, string> = {
          '학자금 대출': 'STUDENT_LOAN',
          '신용 대출': 'CREDIT',
          '주택 대출': 'MORTGAGE',
          기타: 'ETC',
        }
        await postJson(`${API}/debts/bulk`, {
          items: (assetData.debt?.items ?? [])
            .map((it: any) => ({
              category: debtCategoryMap[it.category] ?? it.category,
              loan_amount: Number(it.loan_amount ?? 0),
              repay_amount: Number(it.repay_amount ?? 0),
              interest_rate: Number(it.interest_rate ?? 0),
              compound: it.compound ?? 'COMPOUND',
            }))
            .filter((x: any) => x.loan_amount > 0),
        })
      }

      setCurrentPage('mainPage')
    } catch (e) {
      console.error('전송 실패', e)
      setCurrentPage('mainPage')
    }
  }

  // ---------------------
  // Plan Flow handlers
  // ---------------------
  const handlePlanGoalNext = (goal: PlanGoalData) => {
    setPlanState((prev) => ({ ...prev, goal }))
    setCurrentPage('planIncome')
  }

  const handlePlanIncomeNext = (income: PlanIncomeData) => {
    setPlanState((prev) => ({ ...prev, income }))
    setCurrentPage('planOutcome')
  }

  const handlePlanOutcomeNext = (outcome: PlanOutcomeData) => {
    setPlanState((prev) => ({ ...prev, outcome }))
    setCurrentPage('planTaxRate')
  }

  const handlePlanTaxNext = (taxRate: PlanTaxRateData) => {
    setPlanState((prev) => ({ ...prev, taxRate }))
    setCurrentPage('planLifestyle')
  }

  const handlePlanLifestyleFinish = async (lifestyle: PlanLifestyleData) => {
    const finalPlan: PlanState = { ...planState, lifestyle }
    setPlanState(finalPlan)

    try {
      const { planId } = await submitPlanAll(API, finalPlan)
      console.log('✅ saved planId =', planId)
    } catch (e) {
      console.error('❌ submit failed', e)
    }

    setCurrentPage('mainPage')
  }

  // ---------------------
  // Back handlers
  // ---------------------
  const handleBackFromSetup = () => setCurrentPage('myAssetPage')

  const handleMyAssetPageBack = () => {
    if (lastSetupPage) {
      setCurrentPage(lastSetupPage)
      return
    }

    const assetsArray = Array.from(selectedAssets)
    const lastFilledAsset = assetsArray.reverse().find(
      (asset) => assetData[asset] && assetData[asset].total > 0
    )

    if (lastFilledAsset === 'savings') setCurrentPage('setupSavings')
    else if (lastFilledAsset === 'investment') setCurrentPage('setupInvestment')
    else if (lastFilledAsset === 'tangible') setCurrentPage('setupRealAssets')
    else if (lastFilledAsset === 'debt') setCurrentPage('setupDebt')
    else setCurrentPage('selectAssets')
  }

  const handleBackFromDetail = () => setCurrentPage('myAssetPage')

  // ---------------------
  // Render switch
  // ---------------------
  switch (currentPage) {
    case 'selectAssets':
      return <SetupSelectAssets onNext={handleSelectAssetsNext} onBack={handleSelectAssetsBack} />

    case 'myAssetPage': {
      const hasUnfilledAssets = Array.from(selectedAssets).some(
        (assetType) => !assetData[assetType] || assetData[assetType].total === 0
      )
      return (
        <MyAssetPage
          selectedAssets={selectedAssets}
          assetData={assetData}
          onInputClick={handleMyAssetPageInput}
          onAssetClick={handleAssetClick}
          onGoToMain={handleGoToMain}
          onBack={handleMyAssetPageBack}
          hasUnfilledAssets={hasUnfilledAssets}
        />
      )
    }

    case 'setupSavings':
      return <SetupSavings onComplete={(d) => handleSetupComplete('savings', d)} onBack={handleBackFromSetup} />

    case 'setupInvestment':
      return <SetupInvestment onComplete={(d) => handleSetupComplete('investment', d)} onBack={handleBackFromSetup} />

    case 'setupRealAssets':
      return <SetupRealAssets onComplete={(d) => handleSetupComplete('tangible', d)} onBack={handleBackFromSetup} />

    case 'setupDebt':
      return <SetupDebt onComplete={(d) => handleSetupComplete('debt', d)} onBack={handleBackFromSetup} />

    case 'assetDetail':
      return (
        <AssetDetailPage
          assetType={selectedAssetForDetail || ''}
          assetData={assetData[selectedAssetForDetail || '']}
          onBack={handleBackFromDetail}
        />
      )

    case 'mainPage':
      return <MainPage assetData={assetData} planState={planState} onPlanClick={() => setCurrentPage('planSetGoal')} />

    case 'planSetGoal':
      return (
        <PlanSetGoal
          initialValue={planState.goal}
          onNext={handlePlanGoalNext}
          onBack={() => setCurrentPage('mainPage')}
        />
      )

    case 'planIncome':
      return (
        <PlanIncome
          initialValue={planState.income}
          onNext={handlePlanIncomeNext}
          onBack={() => setCurrentPage('planSetGoal')}
        />
      )

    case 'planOutcome':
      return (
        <PlanOutcome
          initialValue={planState.outcome}
          onNext={handlePlanOutcomeNext}
          onBack={() => setCurrentPage('planIncome')}
        />
      )

    case 'planTaxRate':
      return (
        <PlanTaxRate
          initialValue={planState.taxRate}
          onNext={handlePlanTaxNext}
          onBack={() => setCurrentPage('planOutcome')}
        />
      )

    case 'planLifestyle':
      return (
        <PlanLifestyle
          initialValue={planState.lifestyle}
          onNext={handlePlanLifestyleFinish}
          onBack={() => setCurrentPage('planTaxRate')}
        />
      )

    default:
      return <SetupPersonalInfo onNext={handlePersonalInfoNext} />
  }
}

export default App

// =====================
// Helpers (App 밖으로 분리)
// =====================

async function fetchJson(url: string) {
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GET failed ${url} (${res.status}) ${text}`)
  }
  return res.json()
}

async function postJson(url: string, payload: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`POST failed ${url} (${res.status}) ${text}`)
  }
  return res.json()
}

async function loadAll(
  API: string,
  setAssetData: (v: Record<string, any>) => void,
  setSelectedAssets: (v: Set<string>) => void
) {
  const [savingsRows, investmentRows, assetRows, debtRows] = await Promise.all([
    fetchJson(`${API}/savings`),
    fetchJson(`${API}/investments`),
    fetchJson(`${API}/assets`),
    fetchJson(`${API}/debts`),
  ])

  const savingsItems = (savingsRows ?? []).map((r: any) => ({
    category: r.category,
    amount: Number(r.amount ?? 0),
  }))
  const savingsTotal = savingsItems.reduce((s: number, x: any) => s + x.amount, 0)

  const investmentItems = (investmentRows ?? []).map((r: any) => ({
    category: r.category,
    amount: Number(r.amount ?? 0),
  }))
  const investmentTotal = investmentItems.reduce((s: number, x: any) => s + x.amount, 0)

  const tangibleItems = (assetRows ?? []).map((r: any) => ({
    category: r.category,
    amount: Number(r.amount ?? 0),
    loan_amount: Number(r.loan_amount ?? 0),
    interest_rate: Number(r.interest_rate ?? 0),
    repay_amount: Number(r.repay_amount ?? 0),
  }))
  const tangibleTotal = tangibleItems.reduce((s: number, x: any) => s + x.amount, 0)

  const debtItems = (debtRows ?? []).map((r: any) => ({
    category: r.category,
    loan_amount: Number(r.loan_amount ?? 0),
    repay_amount: Number(r.repay_amount ?? 0),
    interest_rate: Number(r.interest_rate ?? 0),
    compound: r.compound ?? 'COMPOUND',
  }))
  const debtTotal = debtItems.reduce((s: number, x: any) => s + x.loan_amount, 0)

  setAssetData({
    savings: { items: savingsItems, total: savingsTotal },
    investment: { items: investmentItems, total: investmentTotal },
    tangible: { items: tangibleItems, total: tangibleTotal },
    debt: { items: debtItems, total: debtTotal },
  })

  const selected = new Set<string>()
  if (savingsItems.length) selected.add('savings')
  if (investmentItems.length) selected.add('investment')
  if (tangibleItems.length) selected.add('tangible')
  if (debtItems.length) selected.add('debt')
  setSelectedAssets(selected)
}

async function saveAssetByType(API: string, assetType: string, data: any) {
  if (assetType === 'savings') {
    const map: Record<string, string> = { '일반 예금': 'DEPOSIT', 적금: 'SAVING', 청약: 'SUBSCRIPTION', 기타: 'ETC' }
    const payload = {
      items: (data?.items ?? [])
        .map((it: any) => ({ category: map[it.category] ?? it.category, amount: Number(it.amount ?? 0) }))
        .filter((x: any) => x.amount > 0),
    }
    await postJson(`${API}/savings/bulk`, payload)
    return
  }

  if (assetType === 'investment') {
    const map: Record<string, string> = { 주식: 'STOCK', 부동산: 'REAL_ESTATE', 암호화폐: 'CRYPTO', 기타: 'ETC' }
    const payload = {
      items: (data?.items ?? [])
        .map((it: any) => ({ category: map[it.category] ?? it.category, amount: Number(it.amount ?? 0) }))
        .filter((x: any) => x.amount > 0),
    }
    await postJson(`${API}/investments/bulk`, payload)
    return
  }

  if (assetType === 'tangible') {
    const map: Record<string, string> = { 집: 'HOUSE', 오피스텔: 'OFFICETEL', 상가: 'STORE', 기타: 'ETC' }
    const payload = {
      items: (data?.items ?? []).map((it: any) => ({
        category: map[it.category] ?? it.category,
        amount: Number(it.amount ?? 0),
        loan_amount: Number(it.loan_amount ?? 0),
        interest_rate: Number(it.interest_rate ?? 0),
        repay_amount: Number(it.repay_amount ?? 0),
      })),
    }
    await postJson(`${API}/assets/bulk`, payload)
    return
  }

  if (assetType === 'debt') {
    const map: Record<string, string> = {
      '학자금 대출': 'STUDENT_LOAN',
      '신용 대출': 'CREDIT',
      '주택 대출': 'MORTGAGE',
      기타: 'ETC',
    }
    const payload = {
      items: (data?.items ?? [])
        .map((it: any) => ({
          category: map[it.category] ?? it.category,
          loan_amount: Number(it.loan_amount ?? 0),
          repay_amount: Number(it.repay_amount ?? 0),
          interest_rate: Number(it.interest_rate ?? 0),
          compound: it.compound ?? 'COMPOUND',
        }))
        .filter((x: any) => x.loan_amount > 0),
    }
    await postJson(`${API}/debts/bulk`, payload)
    return
  }

  throw new Error(`unknown assetType: ${assetType}`)
}

// ---------------------
// Plan submit (먼저 /plans 만든 뒤, revenues/expenses/taxes 연달아 생성)
// ---------------------

const WON_PER_MAN = 10_000

function buildPlanBody(planState: any) {
  const goal = planState.goal
  return {
    title: goal ? `${goal.assetType} ${goal.multiplier}배 ${goal.action}` : 'My Plan',
    description: goal ? `${goal.age}세까지 ${goal.assetType}을(를) ${goal.multiplier}배로 ${goal.action}` : '',
    roi: 0,
    dividend: 0,
    inflation: 0,
    retirement_year: 0,
    expected_death_year: 0,
    priority: {
      allocations: [],
      // 백엔드가 문자열 리스트를 바탕으로 priority를 계산할 수 있도록 전달
      lifestyles: planState.lifestyle?.preferences ?? [],
    },
  }
}

function buildRevenueBodies(planId: number, planState: any) {
  const income = planState.income
  if (!income?.items?.length) return []

  const today = new Date().toISOString().slice(0, 10)

  return income.items
    .filter((it: any) => Number(it.amount) > 0)
    .map((it: any) => ({
      plan_id: planId,
      category: 'INCOME',
      amount: Number(it.amount) * WON_PER_MAN,
      frequency: 'YEARLY',
      start_date: today,
      end_date: today,
    }))
}

function buildExpenseBodies(planId: number, planState: any) {
  const outcome = planState.outcome
  if (!outcome?.items?.length) return []

  const today = new Date().toISOString().slice(0, 10)

  return outcome.items
    .filter((it: any) => Number(it.amount) > 0)
    .map((it: any) => ({
      plan_id: planId,
      category: 'EXPENSE', // ✅ 서버 enum에 맞춰 바꿔줘
      amount: Number(it.amount) * WON_PER_MAN,
      frequency: 'YEARLY',
      start_date: today,
      end_date: today,
    }))
}

function buildTaxBodies(planId: number, planState: any) {
  const taxRate = planState.taxRate
  if (!taxRate?.items?.length) return []

  return taxRate.items
    .filter((it: any) => Number(it.taxRate) > 0)
    .map((it: any) => ({
      plan_id: planId,
      category: 'INCOME_TAX',
      rate: Number(it.taxRate),
      frequency: 'YEARLY',
    }))
}

async function submitPlanAll(API: string, planState: any) {
  const created = await postJson(`${API}/plans`, buildPlanBody(planState))
  const planId = created.plan_id ?? created.id
  if (!planId) throw new Error('plan_id not found in /plans response')

  const revenues = buildRevenueBodies(planId, planState)
  const expenses = buildExpenseBodies(planId, planState)
  const taxes = buildTaxBodies(planId, planState)

  await Promise.all([
    ...revenues.map((body) => postJson(`${API}/plans/${planId}/revenues`, body)),
    ...expenses.map((body) => postJson(`${API}/plans/${planId}/expenses`, body)),
    ...taxes.map((body) => postJson(`${API}/plans/${planId}/taxes`, body)),
  ])

  return { planId }
}

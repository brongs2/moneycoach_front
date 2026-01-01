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
import PlanSetSimulationInfo from './pages/PlanSetSimulationInfo'
import PlanIncome from './pages/PlanIncome'
import PlanOutcome from './pages/PlanOutcome'
import PlanTaxRate from './pages/PlanTaxRate'
import PlanLifestyle from './pages/PlanLifestyle'
import PlanPage from './pages/PlanPage'
import './App.css'
// api/plans.ts
import type { PlanDetailResponse } from './types/plan'

import type {
  PlanState,
  PlanGoalData,
  PlanSimulationInfoData,
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
  | 'planSetSimulationInfo'
  | 'planIncome'
  | 'planOutcome'
  | 'planTaxRate'
  | 'planLifestyle'
  | 'planPage'

interface PersonalInfo {
  purpose: string
  gender: string
  birthDate: string
}

// =====================
// App
// =====================
function App() {
  // 개발 환경에서는 vite proxy를 통해 /api로 프록시됨 (vite.config.ts 참고)
  // vite proxy가 /api 요청을 http://192.168.0.20:8000으로 전달함
  const API = '/api'

  const [currentPage, setCurrentPage] = useState<Page>('personalInfo')
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null)

  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [assetData, setAssetData] = useState<Record<string, any>>({})
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<string | null>(null)
  const [lastSetupPage, setLastSetupPage] = useState<Page | null>(null)

  const [planState, setPlanState] = useState<PlanState>({})
  const [planId, setPlanId] = useState<number | undefined>(undefined)

  // 최초 로드
  useEffect(() => {
    (async () => {
      try {
        await ensureToken(API)
        await loadAll(API, setAssetData, setSelectedAssets)
      } catch (e) {
        console.error(e)
      }
    })()
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

  const handleAssetDataDelete = (category: string) => {
    const updatedAssetData = { ...assetData }
    delete updatedAssetData[category]
    setAssetData(updatedAssetData)
  }

  // 인풋 변경 시 실시간으로 assetData 업데이트
  const handleAssetDataChange = (assetType: string, data: any) => {
    const items = data?.items ?? []
    const total =
      data?.total ??
      items.reduce((sum: number, it: any) => {
        if (assetType === 'debt') return sum + Number(it.amount ?? it.loan_amount ?? 0)
        return sum + Number(it.amount ?? 0)
      }, 0)
    setAssetData((prev) => ({
      ...prev,
      [assetType]: { items, total },
    }))
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

  // setup 페이지에서 "뒤로가기"는 myAssetPage가 아니라 "이전 setup"으로 이동
  const handleSetupBack = (currentAssetType: 'savings' | 'investment' | 'tangible' | 'debt') => {
    const order: Array<'savings' | 'investment' | 'tangible' | 'debt'> = [
      'savings',
      'investment',
      'tangible',
      'debt',
    ]
    const idx = order.indexOf(currentAssetType)
    const prevAsset = order
      .slice(0, idx)
      .reverse()
      .find((a) => selectedAssets.has(a))

    if (prevAsset === 'savings') {
      setCurrentPage('setupSavings')
      setLastSetupPage('setupSavings')
      return
    }
    if (prevAsset === 'investment') {
      setCurrentPage('setupInvestment')
      setLastSetupPage('setupInvestment')
      return
    }
    if (prevAsset === 'tangible') {
      setCurrentPage('setupRealAssets')
      setLastSetupPage('setupRealAssets')
      return
    }
    if (prevAsset === 'debt') {
      setCurrentPage('setupDebt')
      setLastSetupPage('setupDebt')
      return
    }

    // 첫 setup이면 selectAssets로
    setCurrentPage('selectAssets')
  }

  const handleSetupComplete = async (assetType: string, data: any) => {
    console.log('handleSetupComplete called', { assetType, data })
    // 0) 로컬 상태 우선 반영 (백엔드 실패 시에도 루프 방지)
    const items = data?.items ?? []
    const total =
      data?.total ??
      items.reduce((sum: number, it: any) => {
        if (assetType === 'debt') return sum + Number(it.amount ?? it.loan_amount ?? 0)
        return sum + Number(it.amount ?? 0)
      }, 0)
    const updatedAssetData = { ...assetData, [assetType]: { items, total } }
    setAssetData(updatedAssetData)

    // 1) 다음 입력 자산으로 이동 (myAssetPage는 "모두 끝난 뒤" 한 번만)
    const assetOrder = ['savings', 'investment', 'tangible', 'debt']
    const currentIndex = assetOrder.indexOf(assetType)
    const nextAsset = assetOrder
      .slice(currentIndex + 1)
      .find((a) => selectedAssets.has(a) && (!updatedAssetData[a] || updatedAssetData[a].total === 0))

    console.log('handleSetupComplete nextAsset', { currentIndex, selectedAssets: Array.from(selectedAssets), updatedAssetData, nextAsset })

    const goTo = (page: Page) => {
      console.log('handleSetupComplete goTo', page)
      setCurrentPage(page)
      if (page === 'setupSavings' || page === 'setupInvestment' || page === 'setupRealAssets' || page === 'setupDebt') {
        setLastSetupPage(page)
      }
    }

    if (nextAsset === 'investment') goTo('setupInvestment')
    else if (nextAsset === 'tangible') goTo('setupRealAssets')
    else if (nextAsset === 'debt') goTo('setupDebt')
    else goTo('myAssetPage')

    // 2) 백엔드 저장/리로드는 백그라운드로 (실패해도 화면 흐름은 유지)
    ;(async () => {
      try {
        await saveAssetByType(API, assetType, data)
        await loadAll(API, setAssetData, setSelectedAssets)
      } catch (e) {
        console.error('저장 실패(백그라운드)', e)
      }
    })()
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
        }, API)
      }

      // // 자산 bulk 전송(필요한 것만)
      // if (selectedAssets.has('savings')) {
      //   const savingsCategoryMap: Record<string, string> = {
      //     '일반 예금': 'DEPOSIT',
      //     적금: 'SAVING',
      //     청약: 'SUBSCRIPTION',
      //     기타: 'ETC',
      //   }
      //   await postJson(`${API}/savings/bulk`, {
      //     items: (assetData.savings?.items ?? [])
      //       .map((it: any) => ({
      //         category: savingsCategoryMap[it.category] ?? it.category,
      //         amount: Number(it.amount ?? 0),
      //       }))
      //       .filter((x: any) => x.amount > 0),
      //   })
      // }

      // if (selectedAssets.has('investment')) {
      //   const investmentCategoryMap: Record<string, string> = {
      //     주식: 'STOCK',
      //     부동산: 'REAL_ESTATE',
      //     암호화폐: 'CRYPTO',
      //     기타: 'ETC',
      //   }
      //   await postJson(`${API}/investments/bulk`, {
      //     items: (assetData.investment?.items ?? [])
      //       .map((it: any) => ({
      //         category: investmentCategoryMap[it.category] ?? it.category,
      //         amount: Number(it.amount ?? 0),
      //       }))
      //       .filter((x: any) => x.amount > 0),
      //   })
      // }

      // if (selectedAssets.has('tangible')) {
      //   const assetCategoryMap: Record<string, string> = {
      //     집: 'HOUSE',
      //     오피스텔: 'OFFICETEL',
      //     상가: 'STORE',
      //     기타: 'ETC',
      //   }
      //   await postJson(`${API}/assets/bulk`, {
      //     items: (assetData.tangible?.items ?? []).map((it: any) => ({
      //       category: assetCategoryMap[it.category] ?? it.category,
      //       amount: Number(it.amount ?? 0),
      //       loan_amount: Number(it.loan_amount ?? 0),
      //       interest_rate: Number(it.interest_rate ?? 0),
      //       repay_amount: Number(it.repay_amount ?? 0),
      //     })),
      //   })
      // }

      // if (selectedAssets.has('debt')) {
      //   const debtCategoryMap: Record<string, string> = {
      //     '학자금 대출': 'STUDENT_LOAN',
      //     '신용 대출': 'CREDIT',
      //     '주택 대출': 'MORTGAGE',
      //     기타: 'ETC',
      //   }
      //   await postJson(`${API}/debts/bulk`, {
      //     items: (assetData.debt?.items ?? [])
      //       .map((it: any) => ({
      //         category: debtCategoryMap[it.category] ?? it.category,
      //         loan_amount: Number(it.loan_amount ?? 0),
      //         repay_amount: Number(it.repay_amount ?? 0),
      //         interest_rate: Number(it.interest_rate ?? 0),
      //         compound: it.compound ?? 'COMPOUND',
      //       }))
      //       .filter((x: any) => x.loan_amount > 0),
      //   })
      // }

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
    setCurrentPage('planSetSimulationInfo')
  }

  const handlePlanSimulationInfoNext = (simulationInfo: PlanSimulationInfoData) => {
    setPlanState((prev) => ({ ...prev, simulationInfo }))
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
      const { planId: savedPlanId } = await submitPlanAll(API, finalPlan)
      console.log('✅ saved planId =', savedPlanId)
      setPlanId(savedPlanId)
      setCurrentPage('planPage')
    } catch (e) {
      console.error('❌ submit failed', e)
      setCurrentPage('planPage') // 실패해도 PlanPage로 이동
    }
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
  // Loading Bar 계산 (setup 페이지 진행도)
  // ---------------------
  const getSetupProgress = () => {
    // selectAssets(1) + 선택한 자산 수 + myAssetPage(1) = 총 단계 수
    const totalSteps = 2 + selectedAssets.size
    const assetOrder = ['savings', 'investment', 'tangible', 'debt']
    const selectedOrder = assetOrder.filter(a => selectedAssets.has(a))
    
    return { totalSteps, selectedOrder }
  }

  const getSetupCurrentStep = (currentAssetType: string) => {
    const { selectedOrder } = getSetupProgress()
    const currentIndex = selectedOrder.indexOf(currentAssetType)
    // selectAssets(1) + 현재 setup 페이지보다 앞에 있는 완료된 페이지 수 + 현재 페이지(1)
    const completedBefore = selectedOrder
      .slice(0, currentIndex)
      .filter(a => assetData[a] && assetData[a].total > 0).length
    return 1 + completedBefore + 1 // 1(selectAssets) + 완료된 수 + 현재 페이지
  }

  const getMyAssetPageCurrentStep = () => {
    const { selectedOrder } = getSetupProgress()
    // selectAssets(1) + 모든 선택한 자산 완료 수 + myAssetPage(1)
    const completedCount = selectedOrder.filter(a => assetData[a] && assetData[a].total > 0).length
    return 1 + completedCount + 1 // 1(selectAssets) + 모든 완료된 setup + myAssetPage
  }

  // ---------------------
  // Render switch
  // ---------------------
  switch (currentPage) {
    case 'selectAssets': {
      const { totalSteps } = getSetupProgress()
      return (
        <SetupSelectAssets
          onNext={handleSelectAssetsNext}
          onBack={handleSelectAssetsBack}
          initialSelectedAssets={selectedAssets}
          assetData={assetData}
          onAssetDataDelete={handleAssetDataDelete}
          currentStep={1}
          totalSteps={totalSteps}
        />
      )
    }

    case 'myAssetPage': {
      const hasUnfilledAssets = Array.from(selectedAssets).some(
        (assetType) => !assetData[assetType] || assetData[assetType].total === 0
      )
      const { totalSteps } = getSetupProgress()
      const currentStep = getMyAssetPageCurrentStep()
      return (
        <MyAssetPage
          selectedAssets={selectedAssets}
          assetData={assetData}
          onInputClick={handleMyAssetPageInput}
          onAssetClick={handleAssetClick}
          onGoToMain={handleGoToMain}
          onBack={handleMyAssetPageBack}
          hasUnfilledAssets={hasUnfilledAssets}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )
    }

    case 'setupSavings': {
      const { totalSteps } = getSetupProgress()
      const currentStep = getSetupCurrentStep('savings')
      return (
        <SetupSavings
          initialValue={assetData.savings}
          onComplete={(d) => handleSetupComplete('savings', d)}
          onBack={() => handleSetupBack('savings')}
          onDataChange={(d) => handleAssetDataChange('savings', d)}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )
    }

    case 'setupInvestment': {
      const { totalSteps } = getSetupProgress()
      const currentStep = getSetupCurrentStep('investment')
      return (
        <SetupInvestment
          initialValue={assetData.investment}
          onComplete={(d) => handleSetupComplete('investment', d)}
          onBack={() => handleSetupBack('investment')}
          onDataChange={(d) => handleAssetDataChange('investment', d)}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )
    }

    case 'setupRealAssets': {
      const { totalSteps } = getSetupProgress()
      const currentStep = getSetupCurrentStep('tangible')
      return (
        <SetupRealAssets
          initialValue={assetData.tangible}
          onComplete={(d) => handleSetupComplete('tangible', d)}
          onBack={() => handleSetupBack('tangible')}
          onDataChange={(d) => handleAssetDataChange('tangible', d)}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )
    }

    case 'setupDebt': {
      const { totalSteps } = getSetupProgress()
      const currentStep = getSetupCurrentStep('debt')
  return (
        <SetupDebt
          initialValue={assetData.debt}
          onComplete={(d) => handleSetupComplete('debt', d)}
          onBack={() => handleSetupBack('debt')}
          onDataChange={(d) => handleAssetDataChange('debt', d)}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )
    }

    case 'assetDetail':
      return (
        <AssetDetailPage
          assetType={selectedAssetForDetail || ''}
          assetData={assetData[selectedAssetForDetail || '']}
          onBack={handleBackFromDetail}
        />
      )

    case 'mainPage':
      return <MainPage assetData={assetData} planState={planState} onPlanClick={() => setCurrentPage('planSetGoal')} API={API} />

    case 'planSetGoal':
      return (
        <PlanSetGoal
          initialValue={planState.goal}
          onNext={handlePlanGoalNext}
          onBack={() => setCurrentPage('mainPage')}
        />
      )

    case 'planSetSimulationInfo':
      return (
        <PlanSetSimulationInfo
          initialValue={planState.simulationInfo}
          onNext={handlePlanSimulationInfoNext}
          onBack={() => setCurrentPage('planSetGoal')}
        />
      )

    case 'planIncome':
      return (
        <PlanIncome
          initialValue={planState.income}
          onNext={handlePlanIncomeNext}
          onBack={() => setCurrentPage('planSetSimulationInfo')}
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

    case 'planPage':
      return (
        <PlanPage
          planState={planState}
          planId={planId}
          API={API}
          onEditPlan={() => setCurrentPage('planSetGoal')}
          onBack={() => setCurrentPage('mainPage')}
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

const TOKEN_KEY = "mc_token";

async function ensureToken(API: string): Promise<string> {
  let token = sessionStorage.getItem(TOKEN_KEY);

  if (!token) {
    const res = await fetch(`${API}/auth/anon`, { method: "POST" });
    if (!res.ok) throw new Error(`anon failed: ${res.status}`);

    const data = await res.json();
    token = data.access_token as string;
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  return token; // 여기선 string으로 확정됨
}


async function fetchJson(url: string, API: string) {
  const token = await ensureToken(API);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error(`GET failed: ${res.status}`);
  return res.json();
}

async function postJson(url: string, body: any, API: string) {
  const token = await ensureToken(API);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`POST failed: ${res.status}`);
  return res.json();
}

async function loadAll(
  API: string,
  setAssetData: (v: Record<string, any>) => void,
  setSelectedAssets: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void
) {
  const [savingsRows, investmentRows, assetRows, debtRows] = await Promise.all([
    fetchJson(`${API}/savings/`, API),
    fetchJson(`${API}/investments/`, API),
    fetchJson(`${API}/assets/`, API),
    fetchJson(`${API}/debts/`, API),
  ])

  const savingsLabelMap: Record<string, string> = {
    DEPOSIT: '일반 예금',
    SAVING: '적금',
    SUBSCRIPTION: '청약',
    ETC: '기타',
  }
  const investmentLabelMap: Record<string, string> = {
    STOCK: '주식',
    REAL_ESTATE: '부동산',
    CRYPTO: '암호화폐',
    ETC: '기타',
  }
  const tangibleLabelMap: Record<string, string> = {
    HOUSE: '집',
    OFFICETEL: '오피스텔',
    STORE: '상가',
    ETC: '기타',
  }
  const debtLabelMap: Record<string, string> = {
    STUDENT_LOAN: '학자금 대출',
    CREDIT: '신용 대출',
    MORTGAGE: '주택 대출',
    ETC: '기타',
  }

  const savingsItems = (savingsRows ?? []).map((r: any) => ({
    category: savingsLabelMap[r.category] ?? r.category,
    amount: Number(r.amount ?? 0),
  }))
  const savingsTotal = savingsItems.reduce((s: number, x: any) => s + x.amount, 0)

  const investmentItems = (investmentRows ?? []).map((r: any) => ({
    category: investmentLabelMap[r.category] ?? r.category,
    amount: Number(r.amount ?? 0),
  }))
  const investmentTotal = investmentItems.reduce((s: number, x: any) => s + x.amount, 0)

  const tangibleItems = (assetRows ?? []).map((r: any) => ({
    category: tangibleLabelMap[r.category] ?? r.category,
    amount: Number(r.amount ?? 0),
    loan_amount: Number(r.loan_amount ?? 0),
    interest_rate: Number(r.interest_rate ?? 0),
    repay_amount: Number(r.repay_amount ?? 0),
  }))
  const tangibleTotal = tangibleItems.reduce((s: number, x: any) => s + x.amount, 0)

  const debtItems = (debtRows ?? []).map((r: any) => ({
    category: debtLabelMap[r.category] ?? r.category,
    loan_amount: Number(r.loan_amount ?? r.amount ?? 0),
    repay_amount: Number(r.repay_amount ?? 0),
    interest_rate: Number(r.interest_rate ?? 0),
    compound: r.compound ?? 'COMPOUND',
  }))
  const debtTotal = debtItems.reduce((s: number, x: any) => s + (x.loan_amount || 0), 0)

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
  setSelectedAssets((prev) => {
    if (!prev || prev.size === 0) return selected
    const merged = new Set(prev)
    selected.forEach((v) => merged.add(v))
    return merged
  })
}

async function saveAssetByType(API: string, assetType: string, data: any) {
  if (assetType === 'savings') {
    const map: Record<string, string> = { '일반 예금': 'DEPOSIT', 적금: 'SAVING', 청약: 'SUBSCRIPTION', 기타: 'ETC' }
    const payload = {
      items: (data?.items ?? [])
        .map((it: any) => ({ category: map[it.category] ?? it.category, amount: Number(it.amount ?? 0) }))
        .filter((x: any) => x.amount > 0),
    }
    await postJson(`${API}/savings/bulk`, payload, API)
    return
  }

  if (assetType === 'investment') {
    const map: Record<string, string> = { 주식: 'STOCK', 부동산: 'REAL_ESTATE', 암호화폐: 'CRYPTO', 기타: 'ETC' }
    const payload = {
      items: (data?.items ?? [])
        .map((it: any) => ({ category: map[it.category] ?? it.category, amount: Number(it.amount ?? 0) }))
        .filter((x: any) => x.amount > 0),
    }
    await postJson(`${API}/investments/bulk`, payload, API)
    return
  }

  if (assetType === 'tangible') {
    const map: Record<string, string> = { 집: 'HOUSE', 오피스텔: 'OFFICETEL', 상가: 'STORE', 기타: 'ETC' }
    const payload = {
      items: (data?.items ?? []).map((it: any) => ({
        category: map[it.category] ?? it.category,
        amount: Number(it.amount ?? 0),
        loan_amount: Number(it.loanAmount ?? it.loan_amount ?? 0),
        interest_rate: Number(it.interestRate ?? it.interest_rate ?? 0),
        repay_amount: Number(it.monthlyPayment ?? it.repay_amount ?? 0),
      })),
    }
    await postJson(`${API}/assets/bulk`, payload, API)
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
          loan_amount: Number(it.amount ?? it.loan_amount ?? 0),
          repay_amount: Number(it.monthlyPayment ?? it.repay_amount ?? 0),
          interest_rate: Number(it.interestRate ?? it.interest_rate ?? 0),
          compound: it.compound ?? 'COMPOUND',
        }))
        .filter((x: any) => Number(x.loan_amount) > 0),
    }
    await postJson(`${API}/debts/bulk`, payload, API)
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
  const payLoad = {
    title: goal ? `${goal.assetType} ${goal.multiplier}배 ${goal.action}` : 'My Plan',
    description: goal ? `${goal.age}세까지 ${goal.assetType}을(를) ${goal.multiplier}배로 ${goal.action}` : '',
    roi: 0,
    dividend: 0,
    inflation: 0,
    retirement_year: 0,
    expected_death_year: 0,
    lifestyle: planState.lifestyle?.preferences ?? [],
  }
  console.log(payLoad)
  return payLoad
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
      rate: Number(it.taxRate) / 100,
      frequency: 'YEARLY',
    }))
}

async function submitPlanAll(API: string, planState: any) {
  const created = await postJson(`${API}/plans/`, buildPlanBody(planState), API)
  const planId = created.plan_id ?? created.id
  if (!planId) throw new Error('plan_id not found in /plans response')

  const revenues = buildRevenueBodies(planId, planState)
  const expenses = buildExpenseBodies(planId, planState)
  const taxes = buildTaxBodies(planId, planState)
  console.log(taxes)
  await Promise.all([
    ...revenues.map((body) => postJson(`${API}/plans/${planId}/revenues`, body, API)),
    ...expenses.map((body) => postJson(`${API}/plans/${planId}/expenses`, body, API)),
    ...taxes.map((body) => postJson(`${API}/plans/${planId}/taxes`, body, API)),
  ])

  return { planId }
}



// fetchPlanDetail은 utils/planApi.ts로 이동했습니다
export { fetchPlanDetail } from './utils/planApi'
import { useState, useEffect } from 'react'
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
import type { PlanState, PlanGoalData, PlanIncomeData, PlanOutcomeData, PlanTaxRateData, PlanLifestyleData } from './types/plan'

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

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('personalInfo')
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null)
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [assetData, setAssetData] = useState<Record<string, any>>({})
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<string | null>(null)
  const [lastSetupPage, setLastSetupPage] = useState<Page | null>(null)
  const [planState, setPlanState] = useState<PlanState>({})

  useEffect(() => {
    loadAll().catch(console.error)
  }, [])
  const handlePersonalInfoNext = (info: PersonalInfo) => {
    setPersonalInfo(info)
    setCurrentPage('selectAssets')
  }

  const handleSelectAssetsBack = () => {
    setCurrentPage('personalInfo')
  }

  const handleSelectAssetsNext = (assets: Set<string>) => {
    setSelectedAssets(assets)
    setCurrentPage('myAssetPage')
  }

  const handleMyAssetPageInput = () => {
    // 고정된 순서: 저축 → 투자 → 유형자산 → 빚
    const assetOrder = ['savings', 'investment', 'tangible', 'debt']
    const nextAssetToInput = assetOrder.find(asset => 
      selectedAssets.has(asset) && (!assetData[asset] || assetData[asset].total === 0)
    )
    
    if (nextAssetToInput) {
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
  }

  const handleSetupComplete = async (assetType: string, data: any) => {
    try {
      // 1) assetType별로 즉시 DB 저장
      if (assetType === 'savings') {
        const savingsCategoryMap: Record<string, string> = {
          '일반 예금': 'DEPOSIT',
          '적금': 'SAVING',
          '청약': 'SUBSCRIPTION',
          '기타': 'ETC',
        }
        const payload = {
          items: (data?.items ?? [])
            .map((it: any) => ({
              category: savingsCategoryMap[it.category] ?? it.category,
              amount: Number(it.amount ?? 0),
            }))
            .filter((x: any) => x.amount > 0),
        }
        await postCategory(`${API}/savings/bulk`, payload)
      }

      if (assetType === 'investment') {
        const investmentCategoryMap: Record<string, string> = {
          '주식': 'STOCK',
          '부동산': 'REAL_ESTATE',
          '암호화폐': 'CRYPTO',
          '기타': 'ETC',
        }
        const payload = {
          items: (data?.items ?? [])
            .map((it: any) => ({
              category: investmentCategoryMap[it.category] ?? it.category,
              amount: Number(it.amount ?? 0),
            }))
            .filter((x: any) => x.amount > 0),
        }
        await postCategory(`${API}/investments/bulk`, payload)
      }

      if (assetType === 'tangible') {
        const assetCategoryMap2: Record<string, string> = {
          '집': 'HOUSE',
          '오피스텔': 'OFFICETEL',
          '상가': 'STORE',
          '기타': 'ETC',
        }
        const payload = {
          items: (data?.items ?? []).map((it: any) => ({
            category: assetCategoryMap2[it.category] ?? it.category,
            amount: Number(it.amount ?? 0),
            loan_amount: Number(it.loan_amount ?? 0),
            interest_rate: Number(it.interest_rate ?? 0),
            repay_amount: Number(it.repay_amount ?? 0),
          })),
        }
        await postCategory(`${API}/assets/bulk`, payload)
      }

      if (assetType === 'debt') {
        const debtCategoryMap: Record<string, string> = {
          '학자금 대출': 'STUDENT_LOAN',
          '신용 대출': 'CREDIT',
          '주택 대출': 'MORTGAGE',
          '기타': 'ETC',
        }
        const payload = {
          items: (data?.items ?? [])
            .map((it: any) => ({
              category: debtCategoryMap[it.category] ?? it.category,
              loan_amount: Number(it.loan_amount ?? 0),
              repay_amount: Number(it.repay_amount ?? 0),
              interest_rate: Number(it.interest_rate ?? 0),
              compound: it.compound ?? 'COMPOUND',
            }))
            .filter((x: any) => x.loan_amount > 0),
        }
        await postCategory(`${API}/debts/bulk`, payload)
      }

      // 2) 저장 후, DB에서 다시 로드해서 화면 데이터 갱신
      await loadAll()

      // 3) 입력 흐름 계속(다음 페이지로 이동)
      setCurrentPage('myAssetPage')
    } catch (e) {
      console.error('저장 실패', e)
      // 실패해도 일단 myAssetPage로
      setCurrentPage('myAssetPage')
    }
  }


  
  const handleAssetClick = (assetType: string) => {
    setSelectedAssetForDetail(assetType)
    setCurrentPage('assetDetail') 
  }
  const API = 'http://localhost:8000/api'

const fetchJson = async (url: string) => {
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GET failed ${url} (${res.status}) ${text}`)
  }
  return res.json()
}

const loadAll = async () => {
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
    debt: { items: debtItems, total: debtItems.reduce((s: number, x: any) => s + (x.loan_amount || 0), 0) },
  })

  // (선택) 메인페이지/차트 표시용으로 자동 선택 세팅
  const selected = new Set<string>()
  if (savingsItems.length) selected.add('savings')
  if (investmentItems.length) selected.add('investment')
  if (tangibleItems.length) selected.add('tangible')
  if (debtItems.length) selected.add('debt')
  setSelectedAssets(selected)
}

async function postCategory(url: string, payload: any) {
  console.log(`➡️ POST ${url}`)
  console.log('📤 payload:', JSON.stringify(payload, null, 2))

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let errorBody: any = null
    try {
      errorBody = await res.json()
    } catch {
      errorBody = await res.text()
    }

    console.error(`❌ API ERROR ${url}`)
    console.error('status:', res.status)
    console.error('error body:', errorBody)

    throw new Error(`API failed: ${url}`)
  }

  const data = await res.json()
  console.log(`✅ API SUCCESS ${url}`, data)
  return data
}


  const handleGoToMain = async () => {
  const submissionData = prepareSubmissionData()

  console.log('=== 백엔드로 전송되는 데이터 ===')
  console.log(JSON.stringify(submissionData, null, 2))
  console.log('================================')

  try {
     if (personalInfo) {
      const genderMap: Record<string, string> = {
        '남성': 'MALE',
        '여성': 'FEMALE',
      }
      const birth = personalInfo.birthDate
      ? personalInfo.birthDate.replace(/\//g, '-')  // ✅ 모든 '/' → '-'
      : null
      const userPayload = {
        birth,
        gender: genderMap[personalInfo.gender] ?? personalInfo.gender ?? null,

        purpose: personalInfo.purpose || '',
      }
      console.log(userPayload)
      await postCategory('http://localhost:8000/api/users/me', userPayload)
    }
      // ✅ SAVINGS
    if (selectedAssets.has('savings')) {
      const savingsCategoryMap: Record<string, string> = {
        '일반 예금': 'DEPOSIT',
        '적금': 'SAVING',
        '청약': 'SUBSCRIPTION',
        '기타': 'ETC',
      }

      const payload = {
        items: (assetData.savings?.items ?? [])
          .map((it: any) => ({
            category: savingsCategoryMap[it.category] ?? it.category,
            amount: Number(it.amount ?? 0),
          }))
          .filter((x: any) => x.amount > 0),
      }

      await postCategory('http://localhost:8000/api/savings/bulk', payload)
    }

    // ✅ INVESTMENT (추가)
    if (selectedAssets.has('investment')) {
      const investmentCategoryMap: Record<string, string> = {
        '주식': 'STOCK',
        '부동산': 'REAL_ESTATE',
        '암호화폐': 'CRYPTO',
        '기타': 'ETC',
      }

      const payload = {
        items: (assetData.investment?.items ?? [])
          .map((it: any) => ({
            category: investmentCategoryMap[it.category] ?? it.category,
            amount: Number(it.amount ?? 0),
          }))
          .filter((x: any) => x.amount > 0),
      }

      await postCategory('http://localhost:8000/api/investments/bulk', payload)
    }

    // tangible/debt도 bulk가 items wrapper면 똑같이 감싸야 함 (swagger 기준)
    if (selectedAssets.has('tangible')) {
    const assetCategoryMap: Record<string, string> = {
      '집': 'HOUSE',
      '오피스텔': 'OFFICETEL',
      '상가': 'STORE',
      '기타': 'ETC',
    }

    const payload = {
      items: (assetData.tangible?.items ?? []).map((it: any) => ({
        category: assetCategoryMap[it.category] ?? it.category,
        amount: Number(it.amount ?? 0),
        loan_amount: Number(it.loan_amount ?? 0),
        interest_rate: Number(it.interest_rate ?? 0),
        repay_amount: Number(it.repay_amount ?? 0),
      })),
    }

    await postCategory('http://localhost:8000/api/assets/bulk', payload)
  }


    if (selectedAssets.has('debt')) {
      const debtCategoryMap: Record<string, string> = {
        '학자금 대출': 'STUDENT_LOAN',
        '신용 대출': 'CREDIT',
        '주택 대출': 'MORTGAGE',
        '기타': 'ETC',
      }

      const payload = {
        items: (assetData.debt?.items ?? [])
          .map((it: any) => ({
            category: debtCategoryMap[it.category] ?? it.category, // ✅ DebtType
            loan_amount: Number(it.loan_amount ?? 0),
            repay_amount: Number(it.repay_amount ?? 0),
            interest_rate: Number(it.interest_rate ?? 0),
            compound: it.compound ?? 'COMPOUND', // ✅ SIMPLE / COMPOUND
          }))
          .filter((x: any) => x.loan_amount > 0),
      }

      await postCategory(
        'http://localhost:8000/api/debts/bulk',
        payload
      )
    }

    
    setCurrentPage('mainPage')
  } catch (e) {
    console.error('전송 실패', e)
    setCurrentPage('mainPage')
  }
}

  // ✅ Goal 저장 후 다음으로
  const handlePlanGoalNext = (goal: PlanGoalData) => {
    setPlanState(prev => ({ ...prev, goal }))
    setCurrentPage('planIncome')
  }

  // ✅ Income(=revenue) 저장 후 다음으로
  const handlePlanIncomeNext = (income: PlanIncomeData) => {
    setPlanState(prev => ({ ...prev, income }))
    setCurrentPage('planOutcome')
  }

  // ✅ Expense 저장 후 다음으로
  const handlePlanOutcomeNext = (outcome: PlanOutcomeData) => {
  setPlanState(prev => ({ ...prev, outcome }))
  setCurrentPage('planTaxRate')
}

  // (선택) TaxRate도 state에 넣고 싶으면 PlanState에 tax 추가하고 여기서 저장
  const handlePlanTaxNext = (taxRate: PlanTaxRateData) => {
  setPlanState(prev => ({ ...prev, taxRate }))
  setCurrentPage('planLifestyle')
}



  // ✅ Lifestyle + priority 저장 후 완료
  const handlePlanLifestyleFinish = (lifestyle: PlanLifestyleData) => {
    const finalPlan = { ...planState, lifestyle }
    setPlanState(finalPlan)

    // ✅ 여기서 최종 plan payload가 다 모임
    console.log('FINAL PLAN ====', finalPlan)

    // (선택) 백엔드 저장
    // await postCategory(`${API}/plans`, finalPlan)

    setCurrentPage('mainPage')
  }

  // 백엔드로 보낼 데이터 구조화 함수
  const prepareSubmissionData = () => {
    const categoryMap: Record<string, string> = {
      savings: '저축',
      investment: '투자',
      tangible: '유형자산',
      debt: '부채'
    }

    const assetsList = Array.from(selectedAssets).map(categoryId => {
      const categoryName = categoryMap[categoryId] || categoryId
      const data = assetData[categoryId]
      
      if (!data || !data.items || data.items.length === 0) {
        return {
          category: categoryName,
          categoryId,
          items: [],
          total: 0,
          unit: '만원'
        }
      }

      // 각 카테고리별로 items를 정리
      const items = data.items.map((item: any) => {
        const formattedItem: any = {
          id: item.id || '',
          amount: item.amount || 0,
          unit: '만원'
        }

        // 저축/투자: type 필드
        if (categoryId === 'savings' || categoryId === 'investment') {
          formattedItem.type = item.type || ''
        }

        // 유형자산: type, ownership, 대출 관련 필드
        if (categoryId === 'tangible') {
          formattedItem.type = item.type || ''
          formattedItem.ownership = item.ownership || ''
          if (item.ownership === '대출') {
            formattedItem.loanAmount = item.loanAmount || 0
            formattedItem.interestRate = item.interestRate || 0
            formattedItem.monthlyPayment = item.monthlyPayment || 0
          }
        }

        // 부채: type, category, 이자율, 월 상환액
        if (categoryId === 'debt') {
          formattedItem.type = item.type || ''
          formattedItem.category = item.category || ''
          formattedItem.interestRate = item.interestRate || 0
          formattedItem.monthlyPayment = item.monthlyPayment || 0
        }

        return formattedItem
      })

      return {
        category: categoryName,
        categoryId,
        items,
        total: data.total || 0,
        unit: '만원'
      }
    })

    return {
      personalInfo: personalInfo || {
        purpose: '',
        gender: '',
        birthDate: ''
      },
      selectedCategories: Array.from(selectedAssets).map(id => ({
        id,
        name: categoryMap[id] || id
      })),
      assets: assetsList
    }
  }

  const handleBackFromSetup = () => {
    setCurrentPage('myAssetPage')
  }

  const handleMyAssetPageBack = () => {
    // 마지막 setup 페이지로 돌아가기
    if (lastSetupPage) {
      setCurrentPage(lastSetupPage)
    } else {
      // 마지막 setup 페이지가 없으면 입력되지 않은 첫 번째 자산의 setup 페이지로
      const assetsArray = Array.from(selectedAssets)
      const lastFilledAsset = assetsArray.reverse().find(asset => assetData[asset] && assetData[asset].total > 0)
      if (lastFilledAsset) {
        if (lastFilledAsset === 'savings') {
          setCurrentPage('setupSavings')
        } else if (lastFilledAsset === 'investment') {
          setCurrentPage('setupInvestment')
        } else if (lastFilledAsset === 'tangible') {
          setCurrentPage('setupRealAssets')
        } else if (lastFilledAsset === 'debt') {
          setCurrentPage('setupDebt')
        }
      } else {
        // 입력된 자산이 없으면 selectAssets로
        setCurrentPage('selectAssets')
      }
    }
  }

  const handleBackFromDetail = () => {
    setCurrentPage('myAssetPage')
  }

  // 페이지 렌더링
  switch (currentPage) {
    case 'selectAssets':
      return (
        <SetupSelectAssets
          onNext={handleSelectAssetsNext}
          onBack={handleSelectAssetsBack}
        />
      )
    case 'myAssetPage':
      const hasUnfilledAssets = Array.from(selectedAssets).some(
        assetType => !assetData[assetType] || assetData[assetType].total === 0
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
    case 'setupSavings':
      return (
        <SetupSavings
          onComplete={(data) => handleSetupComplete('savings', data)}
          onBack={handleBackFromSetup}
        />
      )
    case 'setupInvestment':
      return (
        <SetupInvestment
          onComplete={(data) => handleSetupComplete('investment', data)}
          onBack={handleBackFromSetup}
        />
      )
    case 'setupRealAssets':
      return (
        <SetupRealAssets
          onComplete={(data) => handleSetupComplete('tangible', data)}
          onBack={handleBackFromSetup}
        />
      )
    case 'setupDebt':
      return (
        <SetupDebt
          onComplete={(data) => handleSetupComplete('debt', data)}
          onBack={handleBackFromSetup}
        />
      )
    case 'assetDetail':
      return (
            <AssetDetailPage
              assetType={selectedAssetForDetail || ''}
              assetData={assetData[selectedAssetForDetail || '']}
              onBack={handleBackFromDetail}
            />
          )
        case 'mainPage':
      return (
        <MainPage
          assetData={assetData}
          planState={planState} // ✅ 추가(메인에서 플랜 결과 보여줄거면)
          onPlanClick={() => setCurrentPage('planSetGoal')}
        />
      )

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




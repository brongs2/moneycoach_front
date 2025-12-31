import { useState } from 'react'
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

  const handleSetupComplete = (assetType: string, data: any) => {
    // 먼저 업데이트된 assetData를 계산
    const updatedAssetData = { ...assetData, [assetType]: data }
    setAssetData(updatedAssetData)
    
    // 고정된 순서: 저축 → 투자 → 유형자산 → 빚
    const assetOrder = ['savings', 'investment', 'tangible', 'debt']
    const currentIndex = assetOrder.indexOf(assetType)
    const nextAssetToInput = assetOrder.slice(currentIndex + 1).find(asset => 
      selectedAssets.has(asset) && (!updatedAssetData[asset] || updatedAssetData[asset].total === 0)
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
    } else {
      setCurrentPage('myAssetPage')
    }
  }

  const handleAssetClick = (assetType: string) => {
    setSelectedAssetForDetail(assetType)
    setCurrentPage('assetDetail')
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
      return <MainPage assetData={assetData} onPlanClick={() => setCurrentPage('planSetGoal')} />
    case 'planSetGoal':
      return (
        <PlanSetGoal
          onNext={() => setCurrentPage('planIncome')}
          onBack={() => setCurrentPage('mainPage')}
        />
      )
    case 'planIncome':
      return (
        <PlanIncome
          onNext={() => setCurrentPage('planOutcome')}
          onBack={() => setCurrentPage('planSetGoal')}
        />
      )
    case 'planOutcome':
      return (
        <PlanOutcome
          onNext={() => setCurrentPage('planTaxRate')}
          onBack={() => setCurrentPage('planIncome')}
        />
      )
    case 'planTaxRate':
      return (
        <PlanTaxRate
          onNext={() => setCurrentPage('planLifestyle')}
          onBack={() => setCurrentPage('planOutcome')}
        />
      )
    case 'planLifestyle':
      return (
        <PlanLifestyle
          onNext={() => {
            // TODO: 완료 후 메인 페이지로 이동하거나 다음 단계로
            setCurrentPage('mainPage')
          }}
          onBack={() => setCurrentPage('planTaxRate')}
        />
      )
    default:
      return <SetupPersonalInfo onNext={handlePersonalInfoNext} />
  }
}

export default App




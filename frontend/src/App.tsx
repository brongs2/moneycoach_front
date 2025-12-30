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

  const handleGoToMain = async () => {
    // 모든 데이터를 백엔드로 보낼 수 있는 형태로 정리
    const submissionData = prepareSubmissionData()
    
    // 콘솔에 데이터 출력
    console.log('=== 백엔드로 전송되는 데이터 ===')
    console.log(JSON.stringify(submissionData, null, 2))
    console.log('================================')
    
    // 백엔드로 데이터 전송
    try {
      const response = await fetch('http://localhost:8000/api/user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('데이터 전송 성공:', responseData)
        setCurrentPage('mainPage')
      } else {
        console.error('데이터 전송 실패:', response.statusText)
        // 에러가 있어도 메인 페이지로 이동
        setCurrentPage('mainPage')
      }
    } catch (error) {
      console.error('데이터 전송 중 오류 발생:', error)
      // 에러가 있어도 메인 페이지로 이동
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
      return <MainPage assetData={assetData} />
    default:
      return <SetupPersonalInfo onNext={handlePersonalInfoNext} />
  }
}

export default App




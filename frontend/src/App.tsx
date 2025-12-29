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

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('personalInfo')
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [assetData, setAssetData] = useState<Record<string, any>>({})
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<string | null>(null)
  const [lastSetupPage, setLastSetupPage] = useState<Page | null>(null)

  const handlePersonalInfoNext = () => {
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
    // 선택된 자산 중 입력되지 않은 첫 번째로 이동
    const assetsArray = Array.from(selectedAssets)
    const nextAssetToInput = assetsArray.find(asset => !assetData[asset] || assetData[asset].total === 0)
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
    setAssetData(prev => ({ ...prev, [assetType]: data }))
    // 다음 자산이 있으면 다음 setup 페이지로, 없으면 myAssetPage로
    const assetsArray = Array.from(selectedAssets)
    const currentIndex = assetsArray.indexOf(assetType)
    const nextAssetToInput = assetsArray.slice(currentIndex + 1).find(asset => !assetData[asset] || assetData[asset].total === 0)
    
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

  const handleGoToMain = () => {
    setCurrentPage('mainPage')
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
      const remainingAssetsAfterSavings = Array.from(selectedAssets).filter(
        asset => !assetData[asset] && asset !== 'savings'
      )
      return (
        <SetupSavings
          onComplete={(data) => handleSetupComplete('savings', data)}
          onBack={handleBackFromSetup}
          isLast={remainingAssetsAfterSavings.length === 0}
          onGoToMain={handleGoToMain}
        />
      )
    case 'setupInvestment':
      const remainingAssetsAfterInvestment = Array.from(selectedAssets).filter(
        asset => {
          const hasData = assetData[asset] && assetData[asset].total > 0
          return !hasData && asset !== 'investment'
        }
      )
      return (
        <SetupInvestment
          onComplete={(data) => handleSetupComplete('investment', data)}
          onBack={handleBackFromSetup}
          isLast={remainingAssetsAfterInvestment.length === 0}
          onGoToMain={handleGoToMain}
        />
      )
    case 'setupRealAssets':
      const remainingAssetsAfterRealAssets = Array.from(selectedAssets).filter(
        asset => {
          const hasData = assetData[asset] && assetData[asset].total > 0
          return !hasData && asset !== 'tangible'
        }
      )
      return (
        <SetupRealAssets
          onComplete={(data) => handleSetupComplete('tangible', data)}
          onBack={handleBackFromSetup}
          isLast={remainingAssetsAfterRealAssets.length === 0}
          onGoToMain={handleGoToMain}
        />
      )
    case 'setupDebt':
      const remainingAssetsAfterDebt = Array.from(selectedAssets).filter(
        asset => {
          const hasData = assetData[asset] && assetData[asset].total > 0
          return !hasData && asset !== 'debt'
        }
      )
      return (
        <SetupDebt
          onComplete={(data) => handleSetupComplete('debt', data)}
          onBack={handleBackFromSetup}
          isLast={remainingAssetsAfterDebt.length === 0}
          onGoToMain={handleGoToMain}
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




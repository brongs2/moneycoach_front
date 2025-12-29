import { useState } from 'react'
import StatusBar from '../components/StatusBar'
import Title from '../components/Title'
import LoadingBar from '../components/LoadingBar'
import SelectionButton from '../components/SelectionButton'
import ContentBlueButton from '../components/ContentBlueButton'
import './SetupSelectAssets.css'

// 아이콘 컴포넌트들 (SVG로 구현, currentColor 사용으로 선택 상태에 따라 색상 변경)
const SavingsIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ width: '44px', height: '44px' }}>
    <rect x="21" y="36" width="44" height="31" rx="3" fill="currentColor" opacity="0.3"/>
    <rect x="27" y="15" width="13" height="13" rx="2" fill="currentColor"/>
    <rect x="45" y="30" width="13" height="13" rx="2" fill="currentColor"/>
  </svg>
)

const InvestmentIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ width: '44px', height: '44px' }}>
    <rect x="10" y="30" width="8" height="14" rx="2" fill="currentColor"/>
    <rect x="22" y="20" width="8" height="24" rx="2" fill="currentColor"/>
    <rect x="34" y="10" width="8" height="34" rx="2" fill="currentColor"/>
  </svg>
)

const TangibleAssetIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ width: '44px', height: '44px' }}>
    <rect x="8" y="12" width="28" height="28" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="12" y="18" width="8" height="8" rx="1" fill="currentColor"/>
    <rect x="24" y="18" width="8" height="8" rx="1" fill="currentColor"/>
    <rect x="12" y="30" width="8" height="8" rx="1" fill="currentColor"/>
    <rect x="24" y="30" width="8" height="8" rx="1" fill="currentColor"/>
  </svg>
)

const DebtIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ width: '44px', height: '44px' }}>
    <rect x="12" y="8" width="20" height="28" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="18" y="32" width="8" height="8" rx="1" fill="currentColor"/>
    <rect x="30" y="20" width="8" height="8" rx="1" fill="currentColor"/>
  </svg>
)

interface SetupSelectAssetsProps {
  onNext?: (selectedAssets: Set<string>) => void
  onBack?: () => void
}

const SetupSelectAssets = ({ onNext, onBack }: SetupSelectAssetsProps) => {
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())

  const assetCategories = [
    { id: 'savings', title: '저축', description: '가지고 있는 현금, 예금 등의 현금성 자산', icon: <SavingsIcon /> },
    { id: 'investment', title: '투자', description: '주식, 부동산, 암호화폐 등 투자성 자산', icon: <InvestmentIcon /> },
    { id: 'tangible', title: '유형자산', description: '집, 오피스텔 등의 형태가 있는 자산', icon: <TangibleAssetIcon /> },
    { id: 'debt', title: '부채', description: '학자금 대출, 신용 대출 등 부채', icon: <DebtIcon /> },
  ]

  const toggleAsset = (id: string) => {
    const newSelected = new Set(selectedAssets)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedAssets(newSelected)
  }

  const handleNext = () => {
    console.log('선택된 자산:', Array.from(selectedAssets))
    onNext?.(selectedAssets)
  }

  const handleBack = () => {
    onBack?.()
  }

  return (
    <div className="setup-select-assets">
      <div className="setup-container">
        <div className="setup-header">
          <StatusBar />
        </div>

        <div className="setup-back-button" onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="setup-content">
          <div className="setup-top">
            <LoadingBar currentStep={2} totalSteps={4} />
            <div className="setup-title">
              <h1 className="title-main">가지고 있는 자산 형태를 모두 선택해주세요</h1>
              <p className="title-subtitle">자산관리 성향 파악 및 계획 세우기에 도움이 됩니다</p>
            </div>
          </div>

          <div className="setup-category-selection">
            {assetCategories.map((category) => (
              <SelectionButton
                key={category.id}
                title={category.title}
                description={category.description}
                icon={category.icon}
                selected={selectedAssets.has(category.id)}
                onClick={() => toggleAsset(category.id)}
              />
            ))}
          </div>

          <div className="setup-bottom">
            <ContentBlueButton 
              label="다음" 
              onClick={handleNext}
              disabled={selectedAssets.size === 0}
              style={{ 
                visibility: selectedAssets.size > 0 ? 'visible' : 'hidden',
                opacity: selectedAssets.size > 0 ? 1 : 0,
                pointerEvents: selectedAssets.size > 0 ? 'auto' : 'none'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupSelectAssets

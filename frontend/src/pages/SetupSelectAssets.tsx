import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import Title from '../components/Title'
import LoadingBar from '../components/LoadingBar'
import SelectionButton from '../components/SelectionButton'
import ContentBlueButton from '../components/ContentBlueButton'
import ConfirmModal from '../components/ConfirmModal'
import { SavingsIcon, InvestmentIcon, TangibleAssetIcon, DebtIcon } from '../components/AssetIcons'
import './SetupSelectAssets.css'

interface SetupSelectAssetsProps {
  onNext?: (selectedAssets: Set<string>) => void
  onBack?: () => void
  initialSelectedAssets?: Set<string>
  assetData?: Record<string, { items: any[]; total: number }>
  onAssetDataDelete?: (category: string) => void
}

const SetupSelectAssets = ({
  onNext,
  onBack,
  initialSelectedAssets,
  assetData = {},
  onAssetDataDelete,
}: SetupSelectAssetsProps) => {
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(
    initialSelectedAssets ?? new Set()
  )
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingToggle, setPendingToggle] = useState<string | null>(null)

  // initialSelectedAssets가 변경되면 내부 state 동기화
  useEffect(() => {
    if (initialSelectedAssets) {
      setSelectedAssets(new Set(initialSelectedAssets))
    }
  }, [initialSelectedAssets])

  const assetCategories = [
    { 
      id: 'savings', 
      title: '저축', 
      description: '가지고 있는 현금, 예금 등의 현금성 자산', 
      icon: (selected: boolean) => <SavingsIcon selected={selected} />
    },
    { 
      id: 'investment', 
      title: '투자', 
      description: '주식, 부동산, 암호화폐 등 투자성 자산', 
      icon: (selected: boolean) => <InvestmentIcon selected={selected} />
    },
    { 
      id: 'tangible', 
      title: '유형자산', 
      description: '집, 오피스텔 등의 형태가 있는 자산', 
      icon: (selected: boolean) => <TangibleAssetIcon selected={selected} />
    },
    { 
      id: 'debt', 
      title: '부채', 
      description: '학자금 대출, 신용 대출 등 부채', 
      icon: (selected: boolean) => <DebtIcon selected={selected} />
    },
  ]

  const toggleAsset = (id: string) => {
    const isCurrentlySelected = selectedAssets.has(id)

    // 선택 해제하는 경우에만 경고 확인
    if (isCurrentlySelected) {
      // 해당 카테고리에 입력된 데이터가 있는지 확인
      const hasData = assetData[id] && assetData[id].total > 0

      if (hasData) {
        // 경고 모달 표시
        setPendingToggle(id)
        setShowConfirmModal(true)
        return
      }
    }

    // 데이터가 없거나 선택하는 경우 바로 토글
    const newSelected = new Set(selectedAssets)
    if (isCurrentlySelected) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedAssets(newSelected)
  }

  const handleConfirmDelete = () => {
    if (pendingToggle) {
      // 선택 해제
      const newSelected = new Set(selectedAssets)
      newSelected.delete(pendingToggle)
      setSelectedAssets(newSelected)

      // 데이터 삭제
      onAssetDataDelete?.(pendingToggle)

      setPendingToggle(null)
      setShowConfirmModal(false)
    }
  }

  const handleCancelDelete = () => {
    setPendingToggle(null)
    setShowConfirmModal(false)
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
            {assetCategories.map((category) => {
              const isSelected = selectedAssets.has(category.id)
              return (
                <SelectionButton
                  key={category.id}
                  title={category.title}
                  description={category.description}
                  icon={category.icon(isSelected)}
                  selected={isSelected}
                  onClick={() => toggleAsset(category.id)}
                />
              )
            })}
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

      <ConfirmModal
        isOpen={showConfirmModal}
        message="이전에 입력했던 정보들이 사라질 수 있습니다. 계속하시겠습니까?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="확인"
        cancelText="취소"
      />
    </div>
  )
}

export default SetupSelectAssets

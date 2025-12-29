import { useState } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentToggleButton from '../components/ContentToggleButton'
import ContentBlueButton from '../components/ContentBlueButton'
import AmountInput from '../components/AmountInput'
import './SetupRealAssets.css'

interface RealAssetItem {
  id: string
  type: string
  ownership: string
  amount: number
}

interface SetupRealAssetsProps {
  onComplete: (data: any) => void
  onBack: () => void
  isLast?: boolean
  onGoToMain?: () => void
}

const SetupRealAssets = ({ onComplete, onBack, isLast = false, onGoToMain }: SetupRealAssetsProps) => {
  const [items, setItems] = useState<RealAssetItem[]>([
    { id: '1', type: '집', ownership: '소유', amount: 0 }
  ])

  const assetTypes = ['집', '오피스텔', '상가', '기타']
  const ownershipTypes = ['소유', '임대']

  const handleAddMore = () => {
    const newId = Date.now().toString()
    setItems([...items, { id: newId, type: '집', ownership: '소유', amount: 0 }])
  }

  const handleItemChange = (id: string, field: 'type' | 'ownership' | 'amount', value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleNext = () => {
    const total = items.reduce((sum, item) => sum + item.amount, 0)
    onComplete({
      items: items.filter(item => item.amount > 0),
      total,
    })
  }

  const handleFinish = () => {
    handleNext()
    if (onGoToMain) {
      onGoToMain()
    }
  }

  return (
    <div className="setup-real-assets">
      <div className="setup-container">
        <div className="setup-header">
          <StatusBar />
        </div>

        <div className="setup-back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="setup-content">
          <div className="setup-top">
            <LoadingBar currentStep={3} totalSteps={4} />
            <div className="setup-title">
              <h1 className="title-main">어떤 유형자산을<br />가지고 있나요?</h1>
              <p className="title-subtitle">집, 오피스텔 등 형태가 있는 자산을<br />모두 써주세요.</p>
            </div>
          </div>

          <div className="setup-form">
            {items.map((item) => (
              <div key={item.id} className="real-asset-item">
                <div className="real-asset-input-row">
                  <select 
                    className="real-asset-type-select"
                    value={item.type}
                    onChange={(e) => handleItemChange(item.id, 'type', e.target.value)}
                  >
                    {assetTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <AmountInput
                    value={item.amount}
                    onChange={(value) => handleItemChange(item.id, 'amount', value)}
                  />
                </div>
                <ContentToggleButton
                  label="소유 형태"
                  options={ownershipTypes}
                  value={item.ownership}
                  onChange={(value) => handleItemChange(item.id, 'ownership', value)}
                />
              </div>
            ))}
            <button className="add-more-button" onClick={handleAddMore}>+ 추가하기</button>
          </div>

          <div className={`setup-bottom ${isLast ? 'fixed' : ''}`}>
            {isLast ? (
              <ContentBlueButton label="메인 화면으로 가기" onClick={handleFinish} />
            ) : (
              <ContentBlueButton label="다음" onClick={handleNext} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupRealAssets


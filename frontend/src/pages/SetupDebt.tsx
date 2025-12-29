import { useState } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentToggleButton from '../components/ContentToggleButton'
import ContentBlueButton from '../components/ContentBlueButton'
import AmountInput from '../components/AmountInput'
import './SetupDebt.css'

interface DebtItem {
  id: string
  type: string
  category: string
  amount: number
}

interface SetupDebtProps {
  onComplete: (data: any) => void
  onBack: () => void
  isLast?: boolean
  onGoToMain?: () => void
}

const SetupDebt = ({ onComplete, onBack, isLast = false, onGoToMain }: SetupDebtProps) => {
  const [items, setItems] = useState<DebtItem[]>([
    { id: '1', type: '학자금 대출', category: '대출', amount: 0 }
  ])

  const debtTypes = ['학자금 대출', '신용 대출', '주택 대출', '기타']
  const debtCategories = ['대출', '신용카드']

  const handleAddMore = () => {
    const newId = Date.now().toString()
    setItems([...items, { id: newId, type: '학자금 대출', category: '대출', amount: 0 }])
  }

  const handleItemChange = (id: string, field: 'type' | 'category' | 'amount', value: string | number) => {
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
    <div className="setup-debt">
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
              <h1 className="title-main">어떤 부채를<br />가지고 있나요?</h1>
              <p className="title-subtitle">학자금 대출, 신용 대출 등 부채를<br />모두 써주세요.</p>
            </div>
          </div>

          <div className="setup-form">
            {items.map((item) => (
              <div key={item.id} className="debt-item">
                <div className="debt-input-row">
                  <select 
                    className="debt-type-select"
                    value={item.type}
                    onChange={(e) => handleItemChange(item.id, 'type', e.target.value)}
                  >
                    {debtTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <AmountInput
                    value={item.amount}
                    onChange={(value) => handleItemChange(item.id, 'amount', value)}
                  />
                </div>
                <ContentToggleButton
                  label="부채 유형"
                  options={debtCategories}
                  value={item.category}
                  onChange={(value) => handleItemChange(item.id, 'category', value)}
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

export default SetupDebt


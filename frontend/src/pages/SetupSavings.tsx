import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentBlueButton from '../components/ContentBlueButton'
import AmountInput from '../components/AmountInput'
import './SetupSavings.css'

interface SavingsItem {
  id: string
  type: string
  amount: number
}

interface SetupSavingsProps {
  onComplete: (data: any) => void
  onBack: () => void
  isLast?: boolean
  onGoToMain?: () => void
}

const SetupSavings = ({ onComplete, onBack, isLast = false, onGoToMain }: SetupSavingsProps) => {
  const [items, setItems] = useState<SavingsItem[]>([
    { id: '1', type: '일반 예금', amount: 0 }
  ])
  const [shouldScroll, setShouldScroll] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const savingsTypes = ['일반 예금', '적금', '청약', '기타']

  const handleAddMore = () => {
    const newId = Date.now().toString()
    setItems([...items, { id: newId, type: '일반 예금', amount: 0 }])
  }

  const handleItemChange = (id: string, field: 'type' | 'amount', value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
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

  useEffect(() => {
    const checkSpacing = () => {
      if (formRef.current && !isLast) {
        const container = formRef.current.closest('.setup-container')
        
        if (container) {
          const formRect = formRef.current.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          
          // 버튼이 position: absolute; bottom: 64px일 때의 위치 계산
          // container의 bottom에서 64px 위쪽이 버튼의 top 위치
          const buttonTopWhenAbsolute = containerRect.bottom - 64 - 49 // 64px(하단 여백) + 49px(버튼 높이)
          
          // setup-form의 bottom과 버튼의 top 사이의 실제 간격
          const spacing = buttonTopWhenAbsolute - formRect.bottom
          
          // 간격이 60px보다 작으면 버튼을 레이아웃에 포함 (scrollable)
          // 간격이 60px 이상이면 버튼을 기존 위치 유지 (absolute)
          setShouldScroll(spacing < 60)
        }
      }
    }

    checkSpacing()
    window.addEventListener('resize', checkSpacing)
    const timer = setTimeout(checkSpacing, 100)

    return () => {
      window.removeEventListener('resize', checkSpacing)
      clearTimeout(timer)
    }
  }, [items, isLast])

  return (
    <div className="setup-savings">
      <div className="setup-container">
        <div className="setup-header">
          <StatusBar />
        </div>

        <div className="setup-back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="setup-content-scrollable">
          <div className="setup-top">
            <LoadingBar currentStep={3} totalSteps={4} />
            <div className="setup-title">
              <h1 className="title-main">어떤 방식으로<br />저축하고 있나요?</h1>
              <p className="title-subtitle">일반예금, 적금, 청약 등 저축하고 있는 내용들을<br />모두 써주세요.</p>
            </div>
          </div>

          <div ref={formRef} className="setup-form setup-form-spaced">
            {items.map((item) => (
              <div key={item.id} className="savings-item">
                <div className="savings-input-row">
                  <select 
                    className="savings-type-select"
                    value={item.type}
                    onChange={(e) => handleItemChange(item.id, 'type', e.target.value)}
                  >
                    {savingsTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <AmountInput
                    value={item.amount}
                    onChange={(value) => handleItemChange(item.id, 'amount', value)}
                  />
                  <button 
                    className="savings-delete-button"
                    onClick={() => handleDeleteItem(item.id)}
                    type="button"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#bcbcbc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <button className="add-more-button" onClick={handleAddMore}>+ 추가하기</button>
          </div>

          <div className={`setup-bottom setup-bottom-spaced ${shouldScroll ? 'scrollable' : ''} ${isLast ? 'fixed' : ''}`}>
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

export default SetupSavings


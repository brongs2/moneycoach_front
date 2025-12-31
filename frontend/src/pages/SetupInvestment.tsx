import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentBlueButton from '../components/ContentBlueButton'
import AmountInput from '../components/AmountInput'
import './SetupInvestment.css'

interface InvestmentItem {
  id: string
  category: string   // ✅ type -> category
  amount: number
}

interface SetupInvestmentProps {
  onComplete: (data: any) => void
  onBack: () => void
  initialValue?: { items?: Array<{ category: string; amount: number }>; total?: number }
  onDataChange?: (data: any) => void
}

const SetupInvestment = ({ onComplete, onBack, initialValue, onDataChange }: SetupInvestmentProps) => {
  const initialItems: InvestmentItem[] =
    initialValue?.items && initialValue.items.length > 0
      ? initialValue.items.map((it, idx) => ({
          id: String(idx + 1),
          category: it.category,
          amount: Number(it.amount ?? 0),
        }))
      : [{ id: '1', category: '주식', amount: 0 }]
  const [items, setItems] = useState<InvestmentItem[]>([
    ...initialItems,
  ])
  const [shouldScroll, setShouldScroll] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const investmentTypes = ['주식', '부동산', '암호화폐', '기타']

  const handleAddMore = () => {
    const newId = Date.now().toString()
    setItems([...items, { id: newId, category: '주식', amount: 0 }]) // ✅
  }

  const handleItemChange = (
    id: string,
    field: 'category' | 'amount',          // ✅
    value: string | number
  ) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    )
    setItems(updatedItems)
    
    // 실시간으로 데이터 변경 알림
    const total = updatedItems.reduce((sum, item) => sum + item.amount, 0)
    onDataChange?.({
      items: updatedItems.filter(item => item.amount > 0),
      total,
    })
  }

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id)
    setItems(updatedItems)
    
    // 실시간으로 데이터 변경 알림
    const total = updatedItems.reduce((sum, item) => sum + item.amount, 0)
    onDataChange?.({
      items: updatedItems.filter(item => item.amount > 0),
      total,
    })
  }

  const handleNext = () => {
    const total = items.reduce((sum, item) => sum + item.amount, 0)
    onComplete({
      items: items.filter(item => item.amount > 0),
      total,
    })
  }

  useEffect(() => {
    const checkSpacing = () => {
      if (formRef.current) {
        const container = formRef.current.closest('.setup-container')

        if (container) {
          const formRect = formRef.current.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()

          const buttonTopWhenAbsolute = containerRect.bottom - 64 - 49
          const spacing = buttonTopWhenAbsolute - formRect.bottom

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
  }, [items])

  return (
    <div className="setup-investment">
      <div className="setup-container">
        <div className="setup-header">
          <StatusBar />
        </div>

        <div className="setup-back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="setup-content-scrollable">
          <div className="setup-top">
            <LoadingBar currentStep={3} totalSteps={4} />
            <div className="setup-title">
              <h1 className="title-main">어떤 방식으로<br />투자하고 있나요?</h1>
              <p className="title-subtitle">주식, 부동산, 암호화폐 등 투자하고 있는 내용들을<br />모두 써주세요.</p>
            </div>
          </div>

          <div ref={formRef} className="setup-form setup-form-spaced">
            {items.map((item) => (
              <div key={item.id} className="investment-item">
                <div className="investment-input-row">
                  <select
                    className="investment-type-select"
                    value={item.category} // ✅
                    onChange={(e) => handleItemChange(item.id, 'category', e.target.value)} // ✅
                  >
                    {investmentTypes.map(label => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>

                  <AmountInput
                    value={item.amount}
                    onChange={(value) => handleItemChange(item.id, 'amount', value)}
                  />

                  <button
                    className="investment-delete-button"
                    onClick={() => handleDeleteItem(item.id)}
                    type="button"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#bcbcbc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <button className="add-more-button" onClick={handleAddMore}>+ 추가하기</button>
          </div>

          <div className={`setup-bottom setup-bottom-spaced ${shouldScroll ? 'scrollable' : ''}`}>
            <ContentBlueButton label="다음" onClick={handleNext} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupInvestment

import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentBlueButton from '../components/ContentBlueButton'
import AmountInput from '../components/AmountInput'
import './PlanIncome.css'

interface IncomeItem {
  id: string
  category: string
  amount: number
}
export interface PlanIncomeData {
  items: IncomeItem[]
  total: number
  unit: '만원/년'
}
interface PlanIncomeProps {
  initialValue?: PlanIncomeData        // ✅ 추가
  onNext?: (data: PlanIncomeData) => void
  onBack?: () => void
}



const PlanIncome = ({ initialValue, onNext, onBack }: PlanIncomeProps) => {
  const [items, setItems] = useState<IncomeItem[]>(
    initialValue?.items?.length
      ? initialValue.items
      : [{ id: '1', category: '직장', amount: 0 }]
  )
  const [shouldScroll, setShouldScroll] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const incomeCategories = ['직장', '사업', '부업', '기타']

  const handleAddMore = () => {
    const newId = Date.now().toString()
    setItems([...items, { id: newId, category: '직장', amount: 0 }])
  }

  const handleItemChange = (id: string, field: 'category' | 'amount', value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleNext = () => {
    const normalizedItems = items.map(it => ({
      ...it,
      amount: Number(it.amount ?? 0),
    }))
    const total = normalizedItems.reduce((sum, item) => sum + item.amount, 0)

    if (total > 0) {
      onNext?.({
        items: normalizedItems,
        total,
        unit: '만원/년',
      })
    }
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

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  const isAllFilled = total > 0

  return (
    <div className="plan-income">
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
            <LoadingBar currentStep={2} totalSteps={5} />
            <div className="setup-title">
              <h1 className="title-main">수입을 작성해주세요</h1>
              <p className="title-subtitle">집, 부동산, 귀금속 등 현물로 가지고 있는<br />자산의 종류를 모두 적어주세요.</p>
            </div>
          </div>

          <div ref={formRef} className="setup-form setup-form-spaced">
            {items.map((item) => (
              <div key={item.id} className="income-item">
                <div className="income-input-row">
                  <select 
                    className="income-category-select"
                    value={item.category}
                    onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                  >
                    {incomeCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <div className="income-amount-group">
                    <AmountInput
                      value={item.amount}
                      onChange={(value) => handleItemChange(item.id, 'amount', value)}
                      showUnit={false}
                      unitText="만원/년"
                    />
                    <span className="income-unit">만원/년</span>
                  </div>
                  <button 
                    className="income-delete-button"
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

          <div className={`setup-bottom setup-bottom-spaced ${shouldScroll ? 'scrollable' : ''}`}>
            <ContentBlueButton 
              label="다음" 
              onClick={handleNext}
              disabled={!isAllFilled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlanIncome

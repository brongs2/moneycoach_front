import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentToggleButton from '../components/ContentToggleButton'
import ContentBlueButton from '../components/ContentBlueButton'
import AmountInput from '../components/AmountInput'
import './SetupDebt.css'

interface DebtItem {
  id: string
  category: string          // ✅ type -> category (DebtType)
  compound: string          // ✅ category(단리/복리) -> compound
  loan_amount: number       // ✅ amount -> loan_amount
  interest_rate?: number    // ✅ interestRate -> interest_rate
  repay_amount?: number     // ✅ monthlyPayment -> repay_amount
}

interface SetupDebtProps {
  onComplete: (data: any) => void
  onBack: () => void
}

const SetupDebt = ({ onComplete, onBack }: SetupDebtProps) => {
  const [completedItems, setCompletedItems] = useState<DebtItem[]>([])
  const [currentItem, setCurrentItem] = useState<DebtItem>({
    id: 'current',
    category: '학자금 대출',
    compound: '복리',     // ✅ 기본값(토글 옵션과 맞추기)
    loan_amount: 0,
    interest_rate: 0,
    repay_amount: 0,
  })
  const [shouldScroll, setShouldScroll] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const debtTypes = ['학자금 대출', '신용 대출', '주택 대출', '기타']
  const debtCompounds: [string, string] = ['단리', '복리']  // ✅

  const handleAddMore = () => {
    const itemToAdd = { ...currentItem, id: Date.now().toString() }
    setCompletedItems([...completedItems, itemToAdd])

    setCurrentItem({
      id: 'current',
      category: '학자금 대출',
      compound: '복리',
      loan_amount: 0,
      interest_rate: 0,
      repay_amount: 0,
    })
  }

  const handleItemChange = (
    field: 'category' | 'compound' | 'loan_amount' | 'interest_rate' | 'repay_amount',
    value: string | number
  ) => {
    setCurrentItem({ ...currentItem, [field]: value })
  }

  const handleDeleteCompletedItem = (id: string) => {
    setCompletedItems(completedItems.filter(item => item.id !== id))
  }

  const handleNext = () => {
    const allItems = currentItem.loan_amount > 0
      ? [...completedItems, currentItem]
      : completedItems

    const total = allItems.reduce((sum, item) => sum + item.loan_amount, 0)

    // ✅ 백엔드가 기대하는 이름으로 전달
    onComplete({
      items: allItems
        .filter(item => item.loan_amount > 0)
        .map(item => ({
          category: item.category,
          loan_amount: Number(item.loan_amount ?? 0),
          repay_amount: Number(item.repay_amount ?? 0),
          interest_rate: Number(item.interest_rate ?? 0),
          // 단리/복리 -> SIMPLE/COMPOUND 로 매핑(백엔드 Compound enum에 맞춤)
          compound: item.compound === '단리' ? 'SIMPLE' : 'COMPOUND',
        })),
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
  }, [completedItems, currentItem])

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

        <div className="setup-content-scrollable">
          <div className="setup-top">
            <LoadingBar currentStep={3} totalSteps={4} />
            <div className="setup-title">
              <h1 className="title-main">어떤 부채를<br />가지고 있나요?</h1>
              <p className="title-subtitle">학자금 대출, 신용 대출 등 부채를<br />모두 써주세요.</p>
            </div>
          </div>

          <div ref={formRef} className="setup-form setup-form-spaced">
            {completedItems.map((item) => (
              <div key={item.id} className="debt-summary">
                <div className="debt-summary-content">
                  <span className="summary-text">
                    {item.category},{' '}
                    {item.loan_amount >= 10000
                      ? `${(item.loan_amount / 10000).toFixed(1)}억`
                      : `${item.loan_amount}만원`}
                    {(item.interest_rate ?? 0) > 0 && `, 이자율 ${item.interest_rate}%`}
                    {(item.repay_amount ?? 0) > 0 && (
                      <>
                        , 월 상환액{' '}
                        {(item.repay_amount ?? 0) >= 10000
                          ? `${((item.repay_amount ?? 0) / 10000).toFixed(1)}억`
                          : `${item.repay_amount}만원`}
                      </>
                    )}
                  </span>

                  <button
                    className="debt-summary-delete"
                    onClick={() => handleDeleteCompletedItem(item.id)}
                    type="button"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#bcbcbc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <div className="debt-item">
              <div className="debt-input-row">
                <select
                  className="debt-type-select"
                  value={currentItem.category}
                  onChange={(e) => handleItemChange('category', e.target.value)}
                >
                  {debtTypes.map(label => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>

                <AmountInput
                  value={currentItem.loan_amount}
                  onChange={(value) => handleItemChange('loan_amount', value)}
                />
              </div>

              <ContentToggleButton
                label="부채 유형"
                options={debtCompounds}
                value={currentItem.compound}
                onChange={(value) => handleItemChange('compound', value)}
              />

              <div className="debt-additional-fields">
                <div className="debt-field-row debt-field-row-inline">
                  <div className="debt-field-half">
                    <label className="debt-field-label">이자율</label>
                    <div className="interest-rate-input-container">
                      <input
                        type="number"
                        className="interest-rate-input"
                        value={currentItem.interest_rate || ''}
                        onChange={(e) => {
                          const v = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                          handleItemChange('interest_rate', v)
                        }}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="interest-rate-unit">%</span>
                    </div>
                  </div>

                  <div className="debt-field-half">
                    <label className="debt-field-label">월 상환액</label>
                    <AmountInput
                      value={currentItem.repay_amount || 0}
                      onChange={(value) => handleItemChange('repay_amount', value)}
                    />
                  </div>
                </div>
              </div>
            </div>

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

export default SetupDebt

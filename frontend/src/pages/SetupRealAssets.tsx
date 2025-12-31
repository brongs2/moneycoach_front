import React, { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentToggleButton from '../components/ContentToggleButton'
import ContentBlueButton from '../components/ContentBlueButton'
import AmountInput from '../components/AmountInput'
import './SetupRealAssets.css'

interface RealAssetItem {
  id: string
  category: string            // ✅ type -> category
  ownership: string
  amount: number
  loan_amount?: number        // ✅ loanAmount -> loan_amount
  interest_rate?: number      // ✅ interestRate -> interest_rate
  repay_amount?: number       // ✅ monthlyPayment -> repay_amount
}

interface SetupRealAssetsProps {
  onComplete: (data: any) => void
  onBack: () => void
  initialValue?: { items?: any[]; total?: number }
  onDataChange?: (data: any) => void
}

const SetupRealAssets = ({ onComplete, onBack, initialValue, onDataChange }: SetupRealAssetsProps) => {
  const hydrate = (rawItems?: any[]): { completed: RealAssetItem[]; current: RealAssetItem } => {
    const base: RealAssetItem = {
      id: 'current',
      category: '집',
      ownership: '무대출',
      amount: 0,
      loan_amount: 0,
      interest_rate: 0,
      repay_amount: 0,
    }

    if (!rawItems || rawItems.length === 0) return { completed: [], current: base }

    const mapped: RealAssetItem[] = rawItems.map((it: any, idx: number) => {
      const loanAmount = Number(it.loan_amount ?? it.loanAmount ?? 0)
      const interestRate = Number(it.interest_rate ?? it.interestRate ?? 0)
      const repayAmount = Number(it.repay_amount ?? it.monthlyPayment ?? 0)
      const hasLoan = loanAmount > 0 || interestRate > 0 || repayAmount > 0
      return {
        id: String(idx + 1),
        category: it.category ?? '집',
        ownership: hasLoan ? '대출' : '무대출',
        amount: Number(it.amount ?? 0),
        loan_amount: loanAmount,
        interest_rate: interestRate,
        repay_amount: repayAmount,
      }
    })

    const last = mapped[mapped.length - 1]
    const completed = mapped.slice(0, -1)
    return {
      completed,
      current: { ...last, id: 'current' },
    }
  }

  const hydrated = hydrate(initialValue?.items)
  const [completedItems, setCompletedItems] = useState<RealAssetItem[]>(hydrated.completed)
  const [currentItem, setCurrentItem] = useState<RealAssetItem>(hydrated.current)
  const [shouldScroll, setShouldScroll] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const assetTypes = ['집', '오피스텔', '상가', '기타']
  const ownershipTypes: [string, string] = ['대출', '무대출']

  const handleAddMore = () => {
    const itemToAdd = { ...currentItem, id: Date.now().toString() }
    const updatedCompleted = [...completedItems, itemToAdd]
    setCompletedItems(updatedCompleted)

    const newCurrent = {
      id: 'current',
      category: '집',
      ownership: '무대출',
      amount: 0,
      loan_amount: 0,
      interest_rate: 0,
      repay_amount: 0,
    }
    setCurrentItem(newCurrent)
    
    // 실시간으로 데이터 변경 알림
    const allItems = updatedCompleted.filter(item => item.amount > 0)
    const total = allItems.reduce((sum, item) => sum + item.amount, 0)
    onDataChange?.({
      items: allItems,
      total,
    })
  }

  const handleItemChange = (
    field: 'category' | 'ownership' | 'amount' | 'loan_amount' | 'interest_rate' | 'repay_amount',
    value: string | number
  ) => {
    const updated: RealAssetItem = { ...currentItem, [field]: value }

    // ownership이 무대출이면 대출 관련 필드 0으로 초기화
    if (field === 'ownership' && value === '무대출') {
      updated.loan_amount = 0
      updated.interest_rate = 0
      updated.repay_amount = 0
    }
    setCurrentItem(updated)
    
    // 실시간으로 데이터 변경 알림
    const allItems = updated.amount > 0 ? [...completedItems, updated] : completedItems
    const total = allItems.reduce((sum, item) => sum + item.amount, 0)
    onDataChange?.({
      items: allItems.filter(item => item.amount > 0),
      total,
    })
  }

  const handleDeleteCompletedItem = (id: string) => {
    const updatedCompleted = completedItems.filter(item => item.id !== id)
    setCompletedItems(updatedCompleted)
    
    // 실시간으로 데이터 변경 알림
    const allItems = currentItem.amount > 0 ? [...updatedCompleted, currentItem] : updatedCompleted
    const total = allItems.reduce((sum, item) => sum + item.amount, 0)
    onDataChange?.({
      items: allItems.filter(item => item.amount > 0),
      total,
    })
  }

  const handleNext = () => {
    const allItems =
      currentItem.amount > 0 ? [...completedItems, currentItem] : completedItems

    const total = allItems.reduce((sum, item) => sum + item.amount, 0)

    onComplete({
      // ✅ 서버/SQL이 원하는 형태로 이미 맞춰짐
      items: allItems
        .filter(item => item.amount > 0)
        .map(item => ({
          category: item.category,
          amount: Number(item.amount ?? 0),
          loan_amount: item.ownership === '대출' ? Number(item.loan_amount ?? 0) : 0,
          interest_rate: item.ownership === '대출' ? Number(item.interest_rate ?? 0) : 0,
          repay_amount: item.ownership === '대출' ? Number(item.repay_amount ?? 0) : 0,
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
    <div className="setup-real-assets">
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
              <h1 className="title-main">어떤 유형자산을<br />가지고 있나요?</h1>
              <p className="title-subtitle">집, 오피스텔 등 형태가 있는 자산을<br />모두 써주세요.</p>
            </div>
          </div>

          <div ref={formRef} className="setup-form setup-form-spaced">
            {completedItems.map((item) => (
              <div key={item.id} className="real-asset-summary">
                <div className="real-asset-summary-content">
                  <span className="summary-text">
                    {item.category},{' '}
                    {item.amount >= 10000
                      ? `${(item.amount / 10000).toFixed(1)}억`
                      : `${item.amount}만원`}
                    {item.ownership === '대출' && (item.loan_amount ?? 0) > 0 && (
                      <>
                        , 대출금{' '}
                        {(item.loan_amount ?? 0) >= 10000
                          ? `${((item.loan_amount ?? 0) / 10000).toFixed(1)}억`
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
                      </>
                    )}
                  </span>

                  <button
                    className="real-asset-summary-delete"
                    onClick={() => handleDeleteCompletedItem(item.id)}
                    type="button"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#bcbcbc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <div className="real-asset-item">
              <div className="real-asset-input-row">
                <select
                  className="real-asset-type-select"
                  value={currentItem.category} // ✅
                  onChange={(e) => handleItemChange('category', e.target.value)} // ✅
                >
                  {assetTypes.map(label => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>

                <AmountInput
                  value={currentItem.amount}
                  onChange={(value) => handleItemChange('amount', value)}
                />
              </div>

              <ContentToggleButton
                label=""
                options={ownershipTypes}
                value={currentItem.ownership}
                onChange={(value) => handleItemChange('ownership', value)}
              />

              {currentItem.ownership === '대출' && (
                <div className="real-asset-loan-fields">
                  <div className="loan-field-row loan-field-row-inline">
                    <div className="loan-field-half">
                      <label className="loan-field-label">대출금</label>
                      <AmountInput
                        value={currentItem.loan_amount || 0}
                        onChange={(value) => handleItemChange('loan_amount', value)}
                      />
                    </div>

                    <div className="loan-field-half">
                      <label className="loan-field-label">이자율</label>
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
                  </div>

                  <div className="loan-field-row">
                    <label className="loan-field-label">월 상환액</label>
                    <AmountInput
                      value={currentItem.repay_amount || 0}
                      onChange={(value) => handleItemChange('repay_amount', value)}
                    />
                  </div>
                </div>
              )}
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

export default SetupRealAssets

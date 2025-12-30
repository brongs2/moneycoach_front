import { useState, useEffect, useRef } from 'react'
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
  loanAmount?: number
  interestRate?: number
  monthlyPayment?: number
}

interface SetupRealAssetsProps {
  onComplete: (data: any) => void
  onBack: () => void
}

const SetupRealAssets = ({ onComplete, onBack }: SetupRealAssetsProps) => {
  const [completedItems, setCompletedItems] = useState<RealAssetItem[]>([])
  const [currentItem, setCurrentItem] = useState<RealAssetItem>({
    id: 'current',
    type: '집',
    ownership: '무대출',
    amount: 0
  })
  const [shouldScroll, setShouldScroll] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const assetTypes = ['집', '오피스텔', '상가', '기타']
  const ownershipTypes: [string, string] = ['대출', '무대출']

  const handleAddMore = () => {
    // 현재 입력 중인 항목을 완료된 항목 목록에 추가 (amount가 0이어도 추가 가능)
    const itemToAdd = { ...currentItem, id: Date.now().toString() }
    setCompletedItems([...completedItems, itemToAdd])
    
    // 새로운 빈 항목으로 초기화
    setCurrentItem({
      id: 'current',
      type: '집',
      ownership: '무대출',
      amount: 0
    })
  }

  const handleItemChange = (field: 'type' | 'ownership' | 'amount' | 'loanAmount' | 'interestRate' | 'monthlyPayment', value: string | number) => {
    const updated = { ...currentItem, [field]: value }
    // ownership이 '무대출'로 변경되면 대출 관련 필드 초기화
    if (field === 'ownership' && value === '무대출') {
      updated.loanAmount = 0
      updated.interestRate = 0
      updated.monthlyPayment = 0
    }
    setCurrentItem(updated)
  }

  const handleDeleteCompletedItem = (id: string) => {
    setCompletedItems(completedItems.filter(item => item.id !== id))
  }

  const handleNext = () => {
    // 완료된 항목과 현재 항목을 합쳐서 전달
    const allItems = currentItem.amount > 0 
      ? [...completedItems, currentItem]
      : completedItems
    
    const total = allItems.reduce((sum, item) => sum + item.amount, 0)
    onComplete({
      items: allItems.filter(item => item.amount > 0),
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
  }, [completedItems, currentItem])

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

        <div className="setup-content-scrollable">
          <div className="setup-top">
            <LoadingBar currentStep={3} totalSteps={4} />
            <div className="setup-title">
              <h1 className="title-main">어떤 유형자산을<br />가지고 있나요?</h1>
              <p className="title-subtitle">집, 오피스텔 등 형태가 있는 자산을<br />모두 써주세요.</p>
            </div>
          </div>

          <div ref={formRef} className="setup-form setup-form-spaced">
            {/* 완료된 항목들 요약 표시 */}
            {completedItems.map((item) => (
              <div key={item.id} className="real-asset-summary">
                <div className="real-asset-summary-content">
                  <span className="summary-text">
                    {item.type}, {item.amount >= 10000 
                      ? `${(item.amount / 10000).toFixed(1)}억`
                      : `${item.amount}만원`}
                    {item.ownership === '대출' && item.loanAmount && item.loanAmount > 0 && (
                      <>, 대출금 {item.loanAmount >= 10000 
                        ? `${(item.loanAmount / 10000).toFixed(1)}억`
                        : `${item.loanAmount}만원`}
                        {item.interestRate && item.interestRate > 0 && `, 이자율 ${item.interestRate}%`}
                        {item.monthlyPayment && item.monthlyPayment > 0 && (
                          <>, 월 상환액 {item.monthlyPayment >= 10000 
                            ? `${(item.monthlyPayment / 10000).toFixed(1)}억`
                            : `${item.monthlyPayment}만원`}</>
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
                      <path d="M18 6L6 18M6 6l12 12" stroke="#bcbcbc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* 현재 입력 중인 항목 */}
            <div className="real-asset-item">
              <div className="real-asset-input-row">
                <select 
                  className="real-asset-type-select"
                  value={currentItem.type}
                  onChange={(e) => handleItemChange('type', e.target.value)}
                >
                  {assetTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
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
                        value={currentItem.loanAmount || 0}
                        onChange={(value) => handleItemChange('loanAmount', value)}
                      />
                    </div>
                    <div className="loan-field-half">
                      <label className="loan-field-label">이자율</label>
                      <div className="interest-rate-input-container">
                        <input
                          type="number"
                          className="interest-rate-input"
                          value={currentItem.interestRate || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            handleItemChange('interestRate', value)
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
                      value={currentItem.monthlyPayment || 0}
                      onChange={(value) => handleItemChange('monthlyPayment', value)}
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


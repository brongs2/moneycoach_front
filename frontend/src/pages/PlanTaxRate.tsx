import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentBlueButton from '../components/ContentBlueButton'
import './PlanTaxRate.css'

import type { PlanTaxRateData, PlantaxRateItem } from '../types/plan'

interface PlanTaxRateProps {
  initialValue?: PlanTaxRateData
  onNext?: (data: PlanTaxRateData) => void
  onBack?: () => void
}

const PlanTaxRate = ({ initialValue, onNext, onBack }: PlanTaxRateProps) => {
  const taxCategories = ['소득세', '종합소득세', '기타']

  // ✅ initialValue 반영 (없으면 기본 1개)
  const [items, setItems] = useState<PlantaxRateItem[]>(
    initialValue?.items?.length
      ? initialValue.items
      : [{ taxCategory: '소득세', taxRate: 0 }]
  )

  const [shouldScroll, setShouldScroll] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const handleAddMore = () => {
    setItems(prev => [...prev, { taxCategory: '소득세', taxRate: 0 }])
  }

  const handleDeleteItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleChangeItem = (
    index: number,
    field: keyof PlantaxRateItem,
    value: string | number
  ) => {
    setItems(prev =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    )
  }

  const normalizeItems = () => {
    // ✅ 숫자/유효성 정리 + 0보다 큰 것만 남김
    return items
      .map(it => ({
        taxCategory: it.taxCategory,
        taxRate: Number(it.taxRate ?? 0),
      }))
      .filter(it => Number.isFinite(it.taxRate) && it.taxRate > 0)
  }

  const handleNext = () => {
    const normalized = normalizeItems()
    if (normalized.length > 0) {
      onNext?.({ items: normalized })
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

  const validCount = normalizeItems().length
  const isAllFilled = validCount > 0

  return (
    <div className="plan-tax-rate">
      <div className="setup-container">
        <div className="setup-header">
          <StatusBar />
        </div>

        <div className="setup-back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="setup-content-scrollable">
          <div className="setup-top">
            <LoadingBar currentStep={4} totalSteps={5} />
            <div className="setup-title">
              <h1 className="title-main">세율을 설정해주세요</h1>
              <p className="title-subtitle">적용할 세율을 항목별로 입력해주세요.</p>
            </div>
          </div>

          <div ref={formRef} className="setup-form setup-form-spaced">
            {items.map((item, index) => {
              const num = Number(item.taxRate)
              const isFilled = Number.isFinite(num) && num > 0

              return (
                <div key={index} className="tax-rate-item">
                  <div className="tax-rate-input-row">
                    <select
                      className="tax-rate-category-select"
                      value={item.taxCategory}
                      onChange={(e) => handleChangeItem(index, 'taxCategory', e.target.value)}
                    >
                      {taxCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>

                    <div className="tax-rate-amount-group">
                      <input
                        type="text"
                        className={`tax-rate-input ${isFilled ? 'filled' : ''}`}
                        placeholder="00"
                        value={String(item.taxRate ?? '')}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '')
                          handleChangeItem(index, 'taxRate', value === '' ? 0 : Number(value))
                        }}
                      />
                      <span className="tax-rate-unit">%</span>
                    </div>

                    <button
                      className="tax-rate-delete-button"
                      onClick={() => handleDeleteItem(index)}
                      type="button"
                      aria-label="delete"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="#bcbcbc"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}

            <button className="add-more-button" onClick={handleAddMore} type="button">
              + 추가하기
            </button>
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

export default PlanTaxRate

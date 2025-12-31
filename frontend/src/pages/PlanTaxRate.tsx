import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentBlueButton from '../components/ContentBlueButton'
import './PlanTaxRate.css'

import type { PlanTaxRateData } from '../types/plan'

interface PlanTaxRateProps {
  initialValue?: PlanTaxRateData
  onNext?: (data: PlanTaxRateData) => void
  onBack?: () => void
}

const PlanTaxRate = ({ initialValue, onNext, onBack }: PlanTaxRateProps) => {
  // ✅ initialValue 있으면 반영
  const [taxRate, setTaxRate] = useState(
    initialValue?.taxRate != null ? String(initialValue.taxRate) : ''
  )
  const [shouldScroll, setShouldScroll] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const handleNext = () => {
    const num = Number(taxRate)
    if (Number.isFinite(num) && num > 0) {
      onNext?.({ taxRate: num }) // ✅ data로 전달
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
  }, [])

  const num = Number(taxRate)
  const isTaxRateFilled = Number.isFinite(num) && num > 0

  return (
    <div className="plan-tax-rate">
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
            <LoadingBar currentStep={4} totalSteps={5} />
            <div className="setup-title">
              <h1 className="title-main">세율을 설정해주세요</h1>
              <p className="title-subtitle">소득세율을 입력해주세요.</p>
            </div>
          </div>

          <div ref={formRef} className="setup-form setup-form-spaced">
            <div className="tax-rate-input-wrapper">
              <input
                type="text"
                className={`tax-rate-input ${isTaxRateFilled ? 'filled' : ''}`}
                placeholder="00"
                value={taxRate}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '')
                  setTaxRate(value)
                }}
              />
              <span className="tax-rate-unit">%</span>
            </div>
          </div>

          <div className={`setup-bottom setup-bottom-spaced ${shouldScroll ? 'scrollable' : ''}`}>
            <ContentBlueButton
              label="다음"
              onClick={handleNext}
              disabled={!isTaxRateFilled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlanTaxRate

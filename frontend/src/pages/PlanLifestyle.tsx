import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentBlueButton from '../components/ContentBlueButton'
import './PlanLifestyle.css'

interface PlanLifestyleProps {
  onNext?: () => void
  onBack?: () => void
}

const PlanLifestyle = ({ onNext, onBack }: PlanLifestyleProps) => {
  const [selectedLifestyles, setSelectedLifestyles] = useState<Set<string>>(new Set())
  const [shouldScroll, setShouldScroll] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const lifestyleOptions = [
    '사치', '안전자산', '비상금',
    '공격투자', '빚청산', '내집마련',
    '목표달성', '은퇴준비', '밸런스',
    '욜로', '균형적인', '현금확보'
  ]

  const lifestyleRows = Array.from(
    { length: Math.ceil(lifestyleOptions.length / 3) },
    (_, i) => lifestyleOptions.slice(i * 3, i * 3 + 3)
  )

  const handleLifestyleToggle = (lifestyle: string) => {
    const newSelected = new Set(selectedLifestyles)
    if (newSelected.has(lifestyle)) {
      newSelected.delete(lifestyle)
    } else {
      newSelected.add(lifestyle)
    }
    setSelectedLifestyles(newSelected)
  }

  const handleNext = () => {
    if (selectedLifestyles.size > 0) {
      onNext?.()
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
  }, [selectedLifestyles])

  const isAnySelected = selectedLifestyles.size > 0

  return (
    <div className="plan-lifestyle">
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
            <LoadingBar currentStep={5} totalSteps={5} />
            <div className="setup-title">
              <h1 className="title-main">선호하는 라이프스타일을<br />골라주세요</h1>
              <p className="title-subtitle">남는 생활비를 선택한 라이프 스타일에 맞춰<br />배분할 수 있습니다.</p>
            </div>
          </div>

          <div ref={formRef} className="setup-form setup-form-spaced">
            <div className="lifestyle-grid">
              {lifestyleRows.map((row, rowIdx) => (
                <div className="lifestyle-row" key={rowIdx}>
                  {row.map((lifestyle) => (
                    <button
                      key={lifestyle}
                      className={`lifestyle-button ${selectedLifestyles.has(lifestyle) ? 'selected' : ''}`}
                      onClick={() => handleLifestyleToggle(lifestyle)}
                      type="button"
                    >
                      {lifestyle}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className={`setup-bottom setup-bottom-spaced ${shouldScroll ? 'scrollable' : ''}`}>
            <ContentBlueButton 
              label="다음" 
              onClick={handleNext}
              disabled={!isAnySelected}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlanLifestyle

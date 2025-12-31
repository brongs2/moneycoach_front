import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import NavigationBar from '../components/NavigationBar'
import ContentBlueButton from '../components/ContentBlueButton'
import './PlanSetGoal.css'

interface PlanSetGoalProps {
  onNext?: () => void
  onBack?: () => void
}

const PlanSetGoal = ({ onNext, onBack }: PlanSetGoalProps) => {
  const [age, setAge] = useState('')
  const [assetType, setAssetType] = useState('')
  const [multiplier, setMultiplier] = useState('')
  const [action, setAction] = useState('')
  const [showAssetDropdown, setShowAssetDropdown] = useState(false)
  const [showMultiplierDropdown, setShowMultiplierDropdown] = useState(false)
  const [showActionDropdown, setShowActionDropdown] = useState(false)

  const assetOptions = ['현재 자산', '저축', '투자', '유형자산', '부채']
  const multiplierOptions = ['1배', '2배', '3배', '5배', '10배']
  const actionOptions = ['확장 시키겠습니다', '유지하겠습니다', '감소시키겠습니다']

  const isAgeFilled = age !== ''
  const isAssetTypeFilled = assetType !== ''
  const isMultiplierFilled = multiplier !== ''
  const isActionFilled = action !== ''

  const isAllFilled = isAgeFilled && isAssetTypeFilled && isMultiplierFilled && isActionFilled

  // 외부 클릭 시 드롭다운 닫기
  const formRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowAssetDropdown(false)
        setShowMultiplierDropdown(false)
        setShowActionDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="plan-set-goal">
      <div className="setup-container">
        <div className="plan-header">
          <StatusBar />
          <div className="plan-back-button" onClick={onBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="plan-content">
          <h1 className="plan-title">제목 1</h1>
          
          <div className="plan-form-wrapper" ref={formRef}>
            <div className="plan-form">
            <div className="plan-form-item">
              <div className="plan-input-wrapper plan-input-age">
                <div className="plan-input-line" />
                <input
                  type="text"
                  className={`plan-input ${isAgeFilled ? 'filled' : ''}`}
                  placeholder="00"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <span className="plan-label">세까지</span>
            </div>

            <div className="plan-form-item">
              <div className="plan-input-wrapper plan-input-asset">
                <div className="plan-input-line" />
                <input
                  type="text"
                  className={`plan-input ${isAssetTypeFilled ? 'filled' : ''}`}
                  placeholder="현재 자산"
                  value={assetType}
                  readOnly
                  onClick={() => {
                    setShowAssetDropdown(!showAssetDropdown)
                    setShowMultiplierDropdown(false)
                    setShowActionDropdown(false)
                  }}
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="plan-chevron">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {showAssetDropdown && (
                  <div className="plan-dropdown">
                    {assetOptions.map((option) => (
                      <div
                        key={option}
                        className="plan-dropdown-item"
                        onClick={() => {
                          setAssetType(option)
                          setShowAssetDropdown(false)
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="plan-label">의</span>
            </div>

            <div className="plan-form-item">
              <div className="plan-input-wrapper plan-input-multiplier">
                <div className="plan-input-line" />
                <input
                  type="text"
                  className={`plan-input ${isMultiplierFilled ? 'filled' : ''}`}
                  placeholder="00배"
                  value={multiplier}
                  readOnly
                  onClick={() => {
                    setShowMultiplierDropdown(!showMultiplierDropdown)
                    setShowAssetDropdown(false)
                    setShowActionDropdown(false)
                  }}
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="plan-chevron">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {showMultiplierDropdown && (
                  <div className="plan-dropdown">
                    {multiplierOptions.map((option) => (
                      <div
                        key={option}
                        className="plan-dropdown-item"
                        onClick={() => {
                          setMultiplier(option)
                          setShowMultiplierDropdown(false)
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="plan-label">만큼</span>
            </div>

            <div className="plan-form-item">
              <div className="plan-input-wrapper plan-input-action">
                <div className="plan-input-line" />
                <input
                  type="text"
                  className={`plan-input ${isActionFilled ? 'filled' : ''}`}
                  placeholder="확장 시키겠습니다"
                  value={action}
                  readOnly
                  onClick={() => {
                    setShowActionDropdown(!showActionDropdown)
                    setShowAssetDropdown(false)
                    setShowMultiplierDropdown(false)
                  }}
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="plan-chevron">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {showActionDropdown && (
                  <div className="plan-dropdown">
                    {actionOptions.map((option) => (
                      <div
                        key={option}
                        className="plan-dropdown-item"
                        onClick={() => {
                          setAction(option)
                          setShowActionDropdown(false)
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          <div className="plan-bottom">
            <ContentBlueButton 
              label="다음" 
              onClick={onNext}
              style={{ 
                visibility: isAllFilled ? 'visible' : 'hidden',
                opacity: isAllFilled ? 1 : 0,
                pointerEvents: isAllFilled ? 'auto' : 'none'
              }}
            />
          </div>
        </div>

        <div className="plan-navigation">
          <NavigationBar activeItem="plan" />
        </div>
      </div>
    </div>
  )
}

export default PlanSetGoal


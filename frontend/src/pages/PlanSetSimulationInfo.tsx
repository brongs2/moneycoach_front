import { useState } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentBlueButton from '../components/ContentBlueButton'
import './PlanSetSimulationInfo.css'

import type { PlanSimulationInfoData } from '../types/plan'

interface PlanSetSimulationInfoProps {
  initialValue?: PlanSimulationInfoData
  onNext?: (data: PlanSimulationInfoData) => void
  onBack?: () => void
}

const PlanSetSimulationInfo = ({ initialValue, onNext, onBack }: PlanSetSimulationInfoProps) => {
  const [investmentReturn, setInvestmentReturn] = useState<number>(
    initialValue?.investmentReturn ?? 7
  )
  const [interestRate, setInterestRate] = useState<number>(
    initialValue?.interestRate ?? 3
  )
  const [inflation, setInflation] = useState<number>(
    initialValue?.inflation ?? 2
  )

  const handleNext = () => {
    onNext?.({
      investmentReturn,
      interestRate,
      inflation,
    })
  }

  const isAllFilled = investmentReturn > 0 && interestRate >= 0 && inflation >= 0

  return (
    <div className="plan-set-simulation-info">
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
            <LoadingBar currentStep={2} totalSteps={5} />
            <div className="setup-title">
              <h1 className="title-main">
                시뮬레이션을 위해<br />
                기본 정보를 설정해주세요.
              </h1>
              <p className="title-subtitle">
                본인이 예상하는 투자 수익률, 금리,<br />
                인플레이션을 적어주세요.
              </p>
            </div>
          </div>

          <div className="setup-form setup-form-spaced">
            <div className="simulation-info-item">
              <div className="simulation-info-row">
                <div className="simulation-info-label">투자 수익률</div>
                <div className="simulation-info-value-group">
                  <input
                    type="text"
                    className={`simulation-info-input ${investmentReturn > 0 ? 'filled' : ''}`}
                    placeholder="7"
                    value={investmentReturn || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      setInvestmentReturn(value === '' ? 0 : Number(value))
                    }}
                  />
                  <span className="simulation-info-unit">%</span>
                </div>
              </div>
              <p className="simulation-info-description">
                평균적으로 사람들의 연간 투자 수익률은 7%입니다.
              </p>
            </div>

            <div className="simulation-info-item">
              <div className="simulation-info-row">
                <div className="simulation-info-label">금리</div>
                <div className="simulation-info-value-group">
                  <input
                    type="text"
                    className={`simulation-info-input ${interestRate > 0 ? 'filled' : ''}`}
                    placeholder="3"
                    value={interestRate || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      setInterestRate(value === '' ? 0 : Number(value))
                    }}
                  />
                  <span className="simulation-info-unit">%</span>
                </div>
              </div>
              <p className="simulation-info-description">
                평균적인 연간 금리 상승률은 3%입니다.
              </p>
            </div>

            <div className="simulation-info-item">
              <div className="simulation-info-row">
                <div className="simulation-info-label">인플레이션</div>
                <div className="simulation-info-value-group">
                  <input
                    type="text"
                    className={`simulation-info-input ${inflation > 0 ? 'filled' : ''}`}
                    placeholder="2"
                    value={inflation || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      setInflation(value === '' ? 0 : Number(value))
                    }}
                  />
                  <span className="simulation-info-unit">%</span>
                </div>
              </div>
              <p className="simulation-info-description">
                평균적으로 연간 인플레이션 상승률은 3%입니다.
              </p>
            </div>
          </div>

          <div className="setup-bottom setup-bottom-spaced">
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

export default PlanSetSimulationInfo


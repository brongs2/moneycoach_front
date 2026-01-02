import { useState, useEffect } from 'react'
import type { PlanState, PlanDetailResponse } from '../types/plan'
import { fetchPlanDetail } from '../utils/planApi'
import StatusBar from '../components/StatusBar'
import NavigationBar from '../components/NavigationBar'
import PlanLineChart from '../components/PlanLineChart'
import { SavingsIcon, InvestmentIcon, TangibleAssetIcon, DebtIcon } from '../components/AssetIcons'
import './PlanPage.css'

interface PlanPageProps {
  planState: PlanState
  planId?: number
  API?: string
  onEditPlan?: () => void
  onBack?: () => void
}

const PlanPage = ({ planState, planId, API = '/api', onEditPlan, onBack }: PlanPageProps) => {
  const [userName] = useState('000') // TODO: 실제 사용자 이름으로 교체
  const [planDetail, setPlanDetail] = useState<PlanDetailResponse | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  // plan detail 데이터 로드
  useEffect(() => {
    if (!planId) return
    
    const loadPlanDetail = async () => {
      try {
        setPlanLoading(true)
        const data = await fetchPlanDetail(API, planId)
        setPlanDetail(data)
      } catch (error) {
        console.error('Plan detail 로드 실패:', error)
      } finally {
        setPlanLoading(false)
      }
    }
    loadPlanDetail()
  }, [API, planId])

  const chartLabels = planDetail?.labels || []
  const chartValues = (() => {
    if (!planDetail || !planDetail.labels) return []
    const netWorthArray = Array.isArray(planDetail.net_worth) ? planDetail.net_worth : (planDetail?.net_worth !== undefined ? [planDetail.net_worth] : [])
    const totalAssetsArray = Array.isArray(planDetail?.total_assets) ? planDetail.total_assets : []
    const source =
      netWorthArray.length > 0 && netWorthArray.some((v) => v !== 0)
        ? netWorthArray
        : totalAssetsArray.length > 0
          ? totalAssetsArray
          : netWorthArray
    const len = Math.min(planDetail.labels.length, source.length)
    return source.slice(0, len).map((v) => v / 10000) // 만원 단위
  })()
  const retirementYear = planDetail?.retirement_year ?? planDetail?.plan?.retirement_year
  const expectedDeathYear = planDetail?.expected_death_year ?? planDetail?.plan?.expected_death_year

  // 플랜 설명 텍스트 생성
  const getPlanDescription = () => {
    if (!planState.goal) return '2032년까지 1달에 300만원 투자하면'
    
    const { age, assetType, multiplier, action } = planState.goal
    const ageStr = age ? `${age}세까지` : '2032년까지'
    
    return `${ageStr} 1달에 300만원 ${assetType || '투자'}하면`
  }

  // 해시태그 생성 (lifestyle에서)
  const getHashtags = () => {
    if (!planState.lifestyle || !planState.lifestyle.preferences) return []
    return planState.lifestyle.preferences.slice(0, 3)
  }

  return (
    <div className="plan-page">
      <div className="setup-container">
        <div className="plan-page-header">
          <StatusBar />
          <div className="plan-page-back-button" onClick={onBack}>
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
          <div className="plan-page-title-section">
            <h1 className="plan-page-title">{userName}님의 첫 번째 계획입니다.</h1>
            <div className="plan-page-hashtags">
              {getHashtags().map((tag, index) => (
                <span key={index} className="plan-page-hashtag">#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="plan-page-content">
          {/* 그래프 섹션 */}
          <div className="plan-page-chart">
            <div className="plan-chart-container">
              <div className="plan-chart-placeholder">
                {planLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</div>
                ) : (
                  <PlanLineChart
                    labels={chartLabels}
                    values={chartValues}
                    retirementYear={retirementYear}
                    expectedDeathYear={expectedDeathYear}
                    height={200}
                    paddingX={24}
                    paddingY={24}
                    placeholder={
                      <div className="plan-chart-empty">
                        <p>계획을 세우고</p>
                        <p>미래를 확인해보세요!</p>
                      </div>
                    }
                  />
                )}
              </div>
            </div>
          </div>

          {/* 계획 추가하기 섹션 */}
          <div className="plan-page-add-section">
            <h2 className="plan-page-add-title">계획 추가하기</h2>
            <div className="plan-page-add-buttons">
              <button className="plan-page-add-button">
                <SavingsIcon selected={false} style={{ width: '40px', height: '47px' }} />
              </button>
              <button className="plan-page-add-button">
                <InvestmentIcon selected={false} style={{ width: '44px', height: '37px' }} />
              </button>
              <button className="plan-page-add-button">
                <TangibleAssetIcon selected={false} style={{ width: '48px', height: '42px' }} />
              </button>
              <button className="plan-page-add-button">
                <DebtIcon selected={false} style={{ width: '42px', height: '43px' }} />
              </button>
            </div>
          </div>

          {/* 플랜 설명 섹션 */}
          <div className="plan-page-description-section">
            <div className="plan-page-description-card">
              <div className="plan-page-description-text">
                <p>{getPlanDescription()}</p>
                <p>{getPlanDescription()}</p>
                <p>집을 살 수 있어요</p>
              </div>
              <button className="plan-page-edit-button" onClick={onEditPlan}>
                계획 수정하기
              </button>
            </div>
          </div>
        </div>

        <div className="plan-page-navigation">
          <NavigationBar activeItem="plan" />
        </div>
      </div>
    </div>
  )
}

export default PlanPage


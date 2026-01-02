import { useState, useEffect, useRef } from 'react'
import type { PlanState, PlanDetailResponse } from '../types/plan'
import { fetchPlanDetail } from '../utils/planApi'
import StatusBar from '../components/StatusBar'
import ContentBlueButton from '../components/ContentBlueButton'
import NavigationBar from '../components/NavigationBar'
import PlanLineChart from '../components/PlanLineChart'
import { SavingsIcon, InvestmentIcon, TangibleAssetIcon, DebtIcon } from '../components/AssetIcons'
import './MainPage.css'

interface MainPageProps {
  assetData: Record<string, any>
  planState?: PlanState
  planId?: number
  onPlanClick?: () => void
  API?: string
}

const MainPage = ({ assetData, planState, planId, onPlanClick, API = '/api' }: MainPageProps) => {  
  const [userName] = useState('000') // TODO: 실제 사용자 이름으로 교체
  const [planDetail, setPlanDetail] = useState<PlanDetailResponse | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chartInnerWidth, setChartInnerWidth] = useState(0)

  // plan id 5 데이터 로드
  useEffect(() => {
    if (!planId) {
      setPlanDetail(null)
      return
    }
  
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

  // 총 자산 계산 (debt는 음수로 처리)
  const totalAssets = Object.entries(assetData).reduce((sum: number, [key, data]: [string, any]) => {
    const value = data?.total || 0
    if (key === 'debt') {
      return sum - value // debt는 음수로 계산
    }
    return sum + value
  }, 0)
  const totalAssetsWithoutDebt = Object.entries(assetData)
    .filter(([key]) => key !== 'debt')
    .reduce((sum: number, [, data]: [string, any]) => sum + (data?.total || 0), 0)

  // 차트 컨테이너 폭 측정
  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setChartInnerWidth(chartContainerRef.current.offsetWidth)
      }
    }
    updateWidth()
    const ro = new ResizeObserver(updateWidth)
    if (chartContainerRef.current) ro.observe(chartContainerRef.current)
    return () => ro.disconnect()
  }, [])

  // 자산별 데이터 준비 (debt를 마지막에 배치하여 오른쪽 아래에 위치하도록)
  const assetBreakdown = [
    { key: 'savings', title: '저축' },
    { key: 'investment', title: '투자' },
    { key: 'tangible', title: '유형자산' },
    { key: 'debt', title: '부채' },
  ].map(category => ({
    ...category,
    amount: assetData[category.key]?.total || 0,
  }))

  // 도넛 차트 데이터 계산 (부채를 마지막에 배치하여 오른쪽 아래에 위치)
  const nonDebtAssets = assetBreakdown.filter(item => item.amount > 0 && item.key !== 'debt')
  const debtAsset = assetBreakdown.find(item => item.key === 'debt' && item.amount > 0)
  
  const totalForChart = assetBreakdown.reduce((sum, item) => sum + item.amount, 0) || 1

  // 도넛 차트 경로 생성
  const generateDonutPath = () => {
    if (totalForChart === 0) {
      // 데이터가 없으면 전체 원
      return <circle cx="68" cy="68" r="54" fill="none" stroke="#c7d3ff" strokeWidth="28" />
    }

    const radius = 54
    const centerX = 68
    const centerY = 68
    const paths: JSX.Element[] = []

    // -90도에서 시작하여 시계방향으로 저축, 투자, 실물자산을 순서대로 그리기
    let currentAngle = +90 // 12시 방향에서 시작
    
    nonDebtAssets.forEach((item) => {
      const percentage = item.amount / totalForChart
      const angle = percentage * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle

      const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
      const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
      const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
      const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

      const largeArcFlag = angle > 180 ? 1 : 0

      // 시계방향이므로 sweep-flag를 1로 설정
      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      ].join(' ')

      paths.push(
        <path
          key={item.key}
          d={pathData}
          fill="none"
          stroke="var(--moneyblue, #4068ff)"
          strokeWidth="28"
          strokeLinecap="butt"
        />
      )

      currentAngle += angle
    })

    // 마지막에 debt를 그려서 원을 완성
    if (debtAsset) {
      const debtPercentage = debtAsset.amount / totalForChart
      const debtAngle = debtPercentage * 360
      
      if (debtAngle > 0) {
        const startAngle = currentAngle // 다른 자산들이 끝나는 지점에서 시작
        const endAngle = startAngle + debtAngle

        const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
        const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
        const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
        const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

        const largeArcFlag = debtAngle > 180 ? 1 : 0

        // 시계방향이므로 sweep-flag를 1로 설정
        const pathData = [
          `M ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        ].join(' ')

        paths.push(
          <path
            key="debt"
            d={pathData}
            fill="none"
            stroke="var(--subtitlegray, #bcbcbc)"
            strokeWidth="28"
            strokeLinecap="butt"
          />
        )
      }
    }

    return paths
  }

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '0원'
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}억`
    }
    return `${amount}만원`
  }

  const formatCurrencyFull = (amount: number) => {
    if (amount === 0) return '0원'
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}억원`
    }
    return `${amount}만원`
  }

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
  const hasPlanData = chartValues.length > 0

  return (
    <div className="main-page">
      <div className="setup-container">
        <div className="main-header">
          <StatusBar />
          <div className="main-greeting">
            <div className="profile-circle" />
            <div className="greeting-text">
              <h1>{userName}님, 안녕하세요.</h1>
              <p>내 자산을 쉽게 관리하고, 안정적인 미래를 준비하세요</p>
            </div>
          </div>
          <div className="main-asset-summary">
            <p className="summary-label">나의 자산</p>
            <div className="asset-card">
              <div className="asset-donut-chart">
                <svg width="136" height="136" viewBox="0 0 136 136">
                  <circle cx="68" cy="68" r="54" fill="#fcfcfc" />
                  {generateDonutPath()}
                  <text
                    x="68"
                    y="68"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="donut-center-text"
                  >
                    {formatCurrency(totalAssets)}
                  </text>
                </svg>
              </div>
              <div className="asset-divider" />
              <div className="asset-breakdown">
                {assetBreakdown.map((item) => {
                  const iconMap: Record<string, React.ReactNode> = {
                    savings: <SavingsIcon selected={false} style={{ width: '24px', height: '28px' }} />,
                    investment: <InvestmentIcon selected={false} style={{ width: '24px', height: '20px' }} />,
                    tangible: <TangibleAssetIcon selected={false} style={{ width: '24px', height: '21px' }} />,
                    debt: <DebtIcon selected={false} style={{ width: '24px', height: '25px' }} />,
                  }
                  return (
                    <div key={item.key} className="asset-breakdown-item">
                      <div className="asset-icon">{iconMap[item.key]}</div>
                      <span className="asset-amount">{formatCurrencyFull(item.amount)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="main-chart">
          <div className="chart-container" ref={chartContainerRef}>
            <div className="chart-placeholder">
              {planLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</div>
              ) : hasPlanData ? (
                <PlanLineChart
                  labels={chartLabels}
                  values={chartValues}
                  retirementYear={retirementYear}
                  expectedDeathYear={expectedDeathYear}
                  height={218}
                  paddingX={24}
                  paddingY={24}
                  placeholder={
                    <div className="chart-callout">
                      <p>계획을 세우고</p>
                      <p>미래를 확인해보세요!</p>
                    </div>
                  }
                />
              ) : (
                <>
                  {chartInnerWidth > 0 && (() => {
                    const chartHeight = 129
                    const currentAssetInManWon = totalAssets / 10000
                    const maxValue = Math.max(currentAssetInManWon, 100)
                    const currentAssetHeight = Math.max(56, (currentAssetInManWon / maxValue) * chartHeight)
                    const pointTop = 73 + (chartHeight - currentAssetHeight)
                    const oneThirdPosition = chartInnerWidth / 3
                    const labelLeft = oneThirdPosition - 48
                    const labelTop = pointTop - 16
                    const totalWithoutDebtInManWon = totalAssetsWithoutDebt
                    return (
                      <>
                        <div className="chart-line" style={{ left: `${oneThirdPosition}px` }} />
                        <div className="chart-point" style={{ 
                          left: `${oneThirdPosition - 6}px`,
                          top: `${pointTop}px`
                        }}>
                          <div className="chart-point-outer" />
                          <div className="chart-point-middle" />
                          <div className="chart-point-inner" />
                        </div>
                        <div className="chart-label" style={{ left: `${labelLeft}px`, top: `${labelTop}px` }}>
                          {totalWithoutDebtInManWon >= 10000 
                            ? `${(totalWithoutDebtInManWon / 10000).toFixed(1)}억`
                            : `${totalWithoutDebtInManWon.toFixed(0)}만`
                          }
                        </div>
                      </>
                    )
                  })()}
                  <div className="chart-callout">
                    <p>계획을 세우고</p>
                    <p>미래를 확인해보세요!</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="main-bottom">
          <ContentBlueButton 
            label="계획 세우기" 
            onClick={onPlanClick || (() => {})}
            style={{ width: '284px' }}
          />
        </div>

        <NavigationBar activeItem="home" />
      </div>
    </div>
  )
}

export default MainPage


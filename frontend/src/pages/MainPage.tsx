import { useState } from 'react'
import type { PlanState } from '../types/plan' 
import StatusBar from '../components/StatusBar'
import ContentBlueButton from '../components/ContentBlueButton'
import NavigationBar from '../components/NavigationBar'
import { SavingsIcon, InvestmentIcon, TangibleAssetIcon, DebtIcon } from '../components/AssetIcons'
import './MainPage.css'

interface MainPageProps {
  assetData: Record<string, any>
  planState?: PlanState
  onPlanClick?: () => void
}


const MainPage = ({ assetData,planState, onPlanClick }: MainPageProps) => {
  const [userName] = useState('000') // TODO: 실제 사용자 이름으로 교체

  // 총 자산 계산
  const totalAssets = Object.values(assetData).reduce((sum: number, data: any) => {
    return sum + (data?.total || 0)
  }, 0)

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
          <div className="chart-container">
            <div className="chart-placeholder">
              <div className="chart-bars">
                {[56, 77, 109, 129, 120, 109, 56, 56, 56, 56, 56, 56].map((height, index) => (
                  <div key={index} className="chart-bar" style={{ height: `${height}px` }} />
                ))}
              </div>
              <div className="chart-line" />
              <div className="chart-point">
                <div className="chart-point-outer" />
                <div className="chart-point-middle" />
                <div className="chart-point-inner" />
              </div>
              <div className="chart-label">8.3억</div>
              <div className="chart-callout">
                <p>계획을 세우고</p>
                <p>미래를 확인해보세요!</p>
              </div>
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


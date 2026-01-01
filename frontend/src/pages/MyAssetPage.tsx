import { useState } from 'react'
import StatusBar from '../components/StatusBar'
import LoadingBar from '../components/LoadingBar'
import ContentBlueButton from '../components/ContentBlueButton'
import NavigationBar from '../components/NavigationBar'
import { SavingsIcon, InvestmentIcon, TangibleAssetIcon, DebtIcon } from '../components/AssetIcons'
import './MyAssetPage.css'

interface MyAssetPageProps {
  selectedAssets: Set<string>
  assetData: Record<string, any>
  onInputClick: () => void
  onAssetClick: (assetType: string) => void
  onGoToMain: () => void
  onBack?: () => void
  hasUnfilledAssets?: boolean
  currentStep?: number
  totalSteps?: number
}

const assetCategoryMap: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  savings: { title: '저축', description: '현금, 예금 등의 현금성 자산', icon: <SavingsIcon selected={false} /> },
  investment: { title: '투자', description: '주식, 부동산, 암호화폐 등 투자성 자산', icon: <InvestmentIcon selected={false} /> },
  tangible: { title: '유형자산', description: '집, 오피스텔 등의 형태가 있는 자산', icon: <TangibleAssetIcon selected={false} /> },
  debt: { title: '부채', description: '학자금 대출, 신용 대출 등 부채', icon: <DebtIcon selected={false} /> },
}

const MyAssetPage = ({ selectedAssets, assetData, onInputClick, onAssetClick, onGoToMain, onBack, hasUnfilledAssets, currentStep = 5, totalSteps = 5 }: MyAssetPageProps) => {
  const [userName] = useState('000') // TODO: 실제 사용자 이름으로 교체

  // 총 자산 계산
  const totalAssets = Object.values(assetData).reduce((sum: number, data: any) => {
    return sum + (data?.total || 0)
  }, 0)

  // 원형 그래프 데이터 (값 있는 항목만, 고정된 순서)
  const allPieData = (['savings', 'investment', 'tangible', 'debt'] as const)
    .filter(assetType => selectedAssets.has(assetType))
    .map(assetType => {
      const data = assetData[assetType] || {}
      return {
        type: assetType,
        value: data.total || 0,
        ...assetCategoryMap[assetType],
      }
    })
    .filter(item => item.value > 0)
  
  // 부채를 제외한 자산과 부채를 분리
  const nonDebtPieData = allPieData.filter(item => item.type !== 'debt')
  const debtPieData = allPieData.find(item => item.type === 'debt')
  const pieData = debtPieData ? [...nonDebtPieData, debtPieData] : nonDebtPieData

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '??? 원'
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}억 원`
    }
    return `${amount}만 원`
  }


  return (
    <div className="my-asset-page">
      <div className="setup-container">
        <div className="setup-header">
          <StatusBar />
        </div>

        <div className="setup-back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="setup-top-my-asset">
          <LoadingBar currentStep={currentStep} totalSteps={totalSteps} invisible />
        </div>

        {/* 위쪽: 나의 자산 (파란색 부분) */}
        <div className="my-asset-header">
          <div className="my-asset-top">
            <div className="my-asset-title">
              <h1 className="title-main">{userName}님의 자산 종류입니다.</h1>
              <div className="title-subtitle">
                <p>각 자산을 기입하고,</p>
                <p>자산에 따라 계획을 세울 수 있습니다.</p>
              </div>
            </div>
          </div>

          <div className="my-asset-chart">
            <div className="pie-chart-container">
              <svg width="236" height="236" viewBox="0 0 236 236" className="pie-chart">
                <circle cx="118" cy="118" r="110" fill="var(--lightgray, #f1f1f1)" />
                {totalAssets > 0 && pieData.length === 1 && (
                  <circle
                    cx="118"
                    cy="118"
                    r="110"
                    fill={pieData[0].type === 'debt' ? 'var(--subtitlegray, #bcbcbc)' : 'var(--moneyblue, #4068ff)'}
                    opacity={0.7}
                    onClick={() => onAssetClick(pieData[0].type)}
                    style={{ cursor: 'pointer' }}
                  />
                )}
                {pieData.length > 1 && (() => {
                  // MainPage와 동일하게 90도(12시 방향)에서 시작
                  let currentAngle = 90
                  const paths: JSX.Element[] = []
                  
                  // 부채를 제외한 자산들을 먼저 그리기
                  nonDebtPieData.forEach((item) => {
                    const percentage = totalAssets > 0 ? (item.value / totalAssets) * 100 : 0
                    if (percentage === 0) return
                    
                    const angle = (percentage / 100) * 360
                    const startAngle = currentAngle
                    const endAngle = currentAngle + angle
                    
                    const startRad = (startAngle * Math.PI) / 180
                    const endRad = (endAngle * Math.PI) / 180
                    const largeArcFlag = angle > 180 ? 1 : 0
                    
                    const x1 = 118 + 110 * Math.cos(startRad)
                    const y1 = 118 + 110 * Math.sin(startRad)
                    const x2 = 118 + 110 * Math.cos(endRad)
                    const y2 = 118 + 110 * Math.sin(endRad)
                    
                    paths.push(
                      <path
                        key={item.type}
                        d={`M 118 118 L ${x1} ${y1} A 110 110 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill="var(--moneyblue, #4068ff)"
                        opacity={0.7}
                        onClick={() => onAssetClick(item.type)}
                        style={{ cursor: 'pointer' }}
                      />
                    )
                    
                    currentAngle += angle
                  })
                  
                  // 마지막에 부채를 그리기
                  if (debtPieData) {
                    const percentage = totalAssets > 0 ? (debtPieData.value / totalAssets) * 100 : 0
                    if (percentage > 0) {
                      const angle = (percentage / 100) * 360
                      const startAngle = currentAngle
                      const endAngle = currentAngle + angle
                      
                      const startRad = (startAngle * Math.PI) / 180
                      const endRad = (endAngle * Math.PI) / 180
                      const largeArcFlag = angle > 180 ? 1 : 0
                      
                      const x1 = 118 + 110 * Math.cos(startRad)
                      const y1 = 118 + 110 * Math.sin(startRad)
                      const x2 = 118 + 110 * Math.cos(endRad)
                      const y2 = 118 + 110 * Math.sin(endRad)
                      
                      paths.push(
                        <path
                          key="debt"
                          d={`M 118 118 L ${x1} ${y1} A 110 110 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill="var(--subtitlegray, #bcbcbc)"
                          opacity={0.7}
                          onClick={() => onAssetClick(debtPieData.type)}
                          style={{ cursor: 'pointer' }}
                        />
                      )
                    }
                  }
                  
                  return paths
                })()}
                <circle cx="118" cy="118" r="55" fill="var(--bgwhite, #fcfcfc)" />
                <text x="118" y="108" textAnchor="middle" className="chart-center-label">
                  총 자산
                </text>
                <text x="118" y="135" textAnchor="middle" className="chart-center-value">
                  {formatCurrency(totalAssets)}
                </text>
              </svg>
            </div>
          </div>

          <div className="my-asset-list">
            <div className="asset-list-header" />
            {(['savings', 'investment', 'tangible', 'debt'] as const)
              .filter((assetType) => selectedAssets.has(assetType))
              .map((assetType) => {
                const category = assetCategoryMap[assetType]
                const data = assetData[assetType] || {}
                return (
                  <div
                    key={assetType}
                    className="asset-item"
                    onClick={() => onAssetClick(assetType)}
                  >
                    <div className="asset-icon">{category.icon}</div>
                    <div className="asset-info">
                      <p className="asset-title">{category.title}</p>
                      <p className="asset-description">{category.description}</p>
                    </div>
                    <div className="asset-value">
                      {formatCurrency(data.total || 0)}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* 버튼: 지정된 위치에 고정 */}
        <div className="my-asset-bottom">
          {hasUnfilledAssets ? (
            <ContentBlueButton 
              label="자산 입력하러 가기" 
              onClick={onInputClick}
              style={{ width: '284px' }}
            />
          ) : (
            <ContentBlueButton 
              label="메인 화면으로 가기" 
              onClick={onGoToMain}
              style={{ width: '284px' }}
            />
          )}
        </div>

        <NavigationBar />
      </div>
    </div>
  )
}

export default MyAssetPage
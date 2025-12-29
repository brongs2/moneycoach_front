import { useState } from 'react'
import StatusBar from '../components/StatusBar'
import ContentBlueButton from '../components/ContentBlueButton'
import './MainPage.css'

interface MainPageProps {
  assetData: Record<string, any>
}

const MainPage = ({ assetData }: MainPageProps) => {
  const [userName] = useState('000') // TODO: 실제 사용자 이름으로 교체

  // 총 자산 계산
  const totalAssets = Object.values(assetData).reduce((sum: number, data: any) => {
    return sum + (data?.total || 0)
  }, 0)

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '0원'
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}억`
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
              <div className="asset-circle">
                <span>{formatCurrency(totalAssets)}</span>
              </div>
              <div className="asset-breakdown">
                {/* TODO: 자산별 상세 정보 표시 */}
              </div>
            </div>
          </div>
        </div>

        <div className="main-chart">
          {/* TODO: 차트 구현 */}
        </div>

        <div className="main-bottom">
          <ContentBlueButton 
            label="계획 세우기" 
            onClick={() => {}}
            style={{ width: '284px' }}
          />
        </div>
      </div>
    </div>
  )
}

export default MainPage


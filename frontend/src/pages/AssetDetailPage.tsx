import StatusBar from '../components/StatusBar'
import './AssetDetailPage.css'

interface AssetDetailPageProps {
  assetType: string
  assetData: any
  onBack: () => void
}

const assetCategoryMap: Record<string, { title: string }> = {
  savings: { title: '저축' },
  investment: { title: '투자' },
  tangible: { title: '유형자산' },
  debt: { title: '부채' },
}

const AssetDetailPage = ({ assetType, assetData, onBack }: AssetDetailPageProps) => {
  const category = assetCategoryMap[assetType] || { title: '자산' }

  return (
    <div className="asset-detail-page">
      <div className="setup-container">
        <div className="setup-header">
          <StatusBar />
        </div>

        <div className="setup-back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="asset-detail-content">
          <h1 className="asset-detail-title">{category.title} 상세</h1>
          <div className="asset-detail-info">
            <p>자산 유형: {assetData?.type || '-'}</p>
            <p>금액: {assetData?.total ? `${assetData.total}만원` : '-'}</p>
            {/* TODO: Figma 디자인에 맞게 상세 정보 표시 */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssetDetailPage


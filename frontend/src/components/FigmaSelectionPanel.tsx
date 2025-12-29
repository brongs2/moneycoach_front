import { useState, useEffect } from 'react'
import './FigmaSelectionPanel.css'

interface FigmaNode {
  name: string
  id: string
  type: string
  width?: number
  height?: number
  children?: FigmaNode[]
}

interface FigmaMetadataResponse {
  node: FigmaNode
  message?: string
}

const FigmaSelectionPanel = () => {
  const [loading, setLoading] = useState(false)
  const [node, setNode] = useState<FigmaNode | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nodeId, setNodeId] = useState<string>('')

  const fetchMetadata = async (id?: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = id ? `?nodeId=${encodeURIComponent(id)}` : ''
      const res = await fetch(`/api/figma/metadata${params}`)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to load metadata' }))
        throw new Error(errorData.detail || 'Failed to load metadata')
      }
      
      const data: FigmaMetadataResponse = await res.json()
      setNode(data.node)
      
      if (data.message) {
        console.warn('MCP 통합 필요:', data.message)
      }
    } catch (e: any) {
      setError(e.message || '알 수 없는 오류가 발생했습니다')
      console.error('Metadata fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchScreenshot = async (id?: string) => {
    setError(null)
    try {
      const params = id ? `?nodeId=${encodeURIComponent(id)}` : ''
      const res = await fetch(`/api/figma/screenshot${params}`)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to load screenshot' }))
        throw new Error(errorData.detail || 'Failed to load screenshot')
      }
      
      const data = await res.json()
      setScreenshot(data.imageDataUrl)
    } catch (e: any) {
      setError(e.message || '스크린샷을 불러올 수 없습니다')
      console.error('Screenshot fetch error:', e)
    }
  }

  const handleFetchMetadata = () => {
    fetchMetadata(nodeId || undefined)
  }

  const handleFetchScreenshot = () => {
    fetchScreenshot(nodeId || undefined)
  }

  useEffect(() => {
    // 초기 로드 시 현재 선택된 프레임 가져오기
    fetchMetadata()
  }, [])

  return (
    <div className="figma-panel">
      <div className="panel-controls">
        <div className="input-group">
          <label htmlFor="nodeId">노드 ID (선택사항):</label>
          <input
            id="nodeId"
            type="text"
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            placeholder="비워두면 현재 선택된 프레임 사용"
            className="node-id-input"
          />
        </div>
        
        <div className="button-group">
          <button 
            onClick={handleFetchMetadata} 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? '불러오는 중...' : '선택한 프레임 불러오기'}
          </button>
          <button 
            onClick={handleFetchScreenshot}
            className="btn btn-secondary"
          >
            스크린샷 보기
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>에러:</strong> {error}
        </div>
      )}

      {node && (
        <div className="node-info">
          <h2>프레임 정보</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">이름:</span>
              <span className="info-value">{node.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">노드 ID:</span>
              <span className="info-value">{node.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">타입:</span>
              <span className="info-value">{node.type}</span>
            </div>
            {node.width && node.height && (
              <div className="info-item">
                <span className="info-label">크기:</span>
                <span className="info-value">
                  {node.width} × {node.height}px
                </span>
              </div>
            )}
          </div>

          {node.children && node.children.length > 0 && (
            <details className="children-details">
              <summary>자식 요소 ({node.children.length}개)</summary>
              <ul className="children-list">
                {node.children.map((child) => (
                  <li key={child.id} className="child-item">
                    <span className="child-name">{child.name}</span>
                    <span className="child-type">({child.type})</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {screenshot && (
        <div className="screenshot-container">
          <h2>스크린샷</h2>
          <div className="screenshot-wrapper">
            <img
              src={screenshot}
              alt="Figma frame screenshot"
              className="screenshot-image"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default FigmaSelectionPanel




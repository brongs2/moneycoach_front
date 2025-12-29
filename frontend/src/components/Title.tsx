import './Title.css'

interface TitleProps {
  className?: string
}

const Title = ({ className }: TitleProps) => {
  return (
    <div className={`title ${className || ''}`}>
      <div className="title-content">
        <h1 className="title-main">개인정보를 입력해주세요</h1>
        <p className="title-subtitle">자산관리 성향 파악 및 계획 세우기에 도움이 됩니다</p>
      </div>
    </div>
  )
}

export default Title

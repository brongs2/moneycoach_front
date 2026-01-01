import './LoadingBar.css'

interface LoadingBarProps {
  currentStep?: number
  totalSteps?: number
  invisible?: boolean
}

const LoadingBar = ({ currentStep = 1, totalSteps = 4, invisible = false }: LoadingBarProps) => {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="loading-bar" style={{ visibility: invisible ? 'hidden' : 'visible' }}>
      <div className="loading-bar-full">
        <div 
          className="loading-bar-progress" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default LoadingBar

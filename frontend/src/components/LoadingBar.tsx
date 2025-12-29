import './LoadingBar.css'

interface LoadingBarProps {
  currentStep?: number
  totalSteps?: number
}

const LoadingBar = ({ currentStep = 1, totalSteps = 4 }: LoadingBarProps) => {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="loading-bar">
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

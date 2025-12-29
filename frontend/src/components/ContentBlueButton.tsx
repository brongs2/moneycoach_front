import './ContentBlueButton.css'
import { CSSProperties } from 'react'

interface ContentBlueButtonProps {
  label: string
  onClick?: () => void
  disabled?: boolean
  style?: CSSProperties
}

const ContentBlueButton = ({ label, onClick, disabled = false, style }: ContentBlueButtonProps) => {
  return (
    <button 
      className="content-blue-button"
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {label}
    </button>
  )
}

export default ContentBlueButton

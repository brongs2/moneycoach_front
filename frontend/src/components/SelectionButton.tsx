import './SelectionButton.css'

interface SelectionButtonProps {
  title: string
  description: string
  icon?: React.ReactNode
  selected?: boolean
  onClick?: () => void
}

const SelectionButton = ({ 
  title, 
  description, 
  icon,
  selected = false,
  onClick 
}: SelectionButtonProps) => {
  return (
    <button 
      className={`selection-button ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {icon && <div className="selection-icon">{icon}</div>}
      <div className="selection-content">
        <p className="selection-title">{title}</p>
        <p className="selection-description">{description}</p>
      </div>
    </button>
  )
}

export default SelectionButton

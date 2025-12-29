import './ContentToggleButton.css'

interface ContentToggleButtonProps {
  label: string
  options: [string, string]
  value?: string
  onChange?: (value: string) => void
}

const ContentToggleButton = ({ 
  label, 
  options, 
  value = options[0],
  onChange 
}: ContentToggleButtonProps) => {
  const handleClick = (option: string) => {
    onChange?.(option)
  }

  return (
    <div className="content-toggle-button">
      <label className="content-label">{label}</label>
      <div className="toggle-container">
        <div className="toggle-background">
          <button
            className={`toggle-option ${value === options[0] ? 'active' : ''}`}
            onClick={() => handleClick(options[0])}
          >
            {options[0]}
          </button>
          <div className="toggle-divider" />
          <button
            className={`toggle-option ${value === options[1] ? 'active' : ''}`}
            onClick={() => handleClick(options[1])}
          >
            {options[1]}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContentToggleButton

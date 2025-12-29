import { useState } from 'react'
import './ContentWithDropdown.css'

interface ContentWithDropdownProps {
  label: string
  value?: string
  placeholder?: string
  options?: string[]
  onChange?: (value: string) => void
}

const ContentWithDropdown = ({ 
  label, 
  value = '', 
  placeholder = '선택해주세요',
  options = [],
  onChange 
}: ContentWithDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value)

  const handleSelect = (option: string) => {
    setSelectedValue(option)
    setIsOpen(false)
    onChange?.(option)
  }

  return (
    <div className="content-with-dropdown">
      <label className="content-label">{label}</label>
      <div className="dropdown-container">
        <div 
          className="dropdown-field"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`dropdown-value ${!selectedValue ? 'placeholder' : ''}`}>
            {selectedValue || placeholder}
          </span>
          <svg 
            className={`dropdown-icon ${isOpen ? 'open' : ''}`}
            width="28" 
            height="28" 
            viewBox="0 0 28 28" 
            fill="none"
          >
            <path d="M7 10L14 17L21 10" stroke="#bcbcbc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {isOpen && options.length > 0 && (
          <div className="dropdown-options">
            {options.map((option, index) => (
              <div
                key={index}
                className="dropdown-option"
                onClick={() => handleSelect(option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ContentWithDropdown

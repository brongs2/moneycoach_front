import { useState } from 'react'
import './AmountInput.css'

interface AmountInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
}

const AmountInput = ({ value, onChange, placeholder = '0' }: AmountInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    if (inputValue === '') {
      onChange(0)
      return
    }

    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue)) {
      // 만원 단위로 처리 (예: 1000 입력 시 1000만원)
      onChange(Math.floor(numValue))
    }
  }

  const handleButtonClick = (increment: number) => {
    const newValue = value + increment
    onChange(newValue)
  }

  const formatDisplayValue = () => {
    if (value === 0) return ''
    if (value >= 10000) {
      return (value / 10000).toFixed(1)
    }
    return value.toString()
  }

  const getUnit = () => {
    if (value >= 10000) {
      return '억'
    }
    return '만원'
  }

  return (
    <div className="amount-input-container">
      <div className="amount-input-row">
        <input
          type="number"
          inputMode="numeric"
          className="amount-input"
          value={formatDisplayValue()}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
        />
        <span className="amount-unit">{getUnit()}</span>
      </div>
      {isFocused && (
        <div className="amount-buttons">
        <button 
          type="button"
          className="amount-button" 
          onClick={(e) => {
            e.preventDefault()
            handleButtonClick(10)
          }}
        >
          +10만
        </button>
        <button 
          type="button"
          className="amount-button" 
          onClick={(e) => {
            e.preventDefault()
            handleButtonClick(100)
          }}
        >
          +100만
        </button>
        <button 
          type="button"
          className="amount-button" 
          onClick={(e) => {
            e.preventDefault()
            handleButtonClick(1000)
          }}
        >
          +1000만
        </button>
        <button 
          type="button"
          className="amount-button" 
          onClick={(e) => {
            e.preventDefault()
            handleButtonClick(10000)
          }}
        >
          +1억
        </button>
        </div>
      )}
    </div>
  )
}

export default AmountInput


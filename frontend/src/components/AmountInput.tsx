import { useState, useEffect, useRef } from 'react'
import './AmountInput.css'

interface AmountInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
}

const AmountInput = ({ value, onChange, placeholder = '0' }: AmountInputProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const expandedContentRef = useRef<HTMLDivElement>(null)

  // value가 변경될 때 inputValue 업데이트 (확대 모드가 아닐 때만)
  useEffect(() => {
    if (!isExpanded) {
      setInputValue('')
    }
  }, [value, isExpanded])



  const handleInputClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 현재 값을 만원 단위로 변환하여 표시
    setInputValue(value.toString())
    setIsExpanded(true)
  }

  const handleNumberPadClick = (value: string) => {
    if (value === 'backspace') {
      // 지우기
      setInputValue(inputValue.slice(0, -1))
    } else if (value === '000') {
      // 000 추가
      setInputValue(inputValue + '000')
    } else if (value === '0000') {
      // 0000 추가
      setInputValue(inputValue + '0000')
    } else {
      // 숫자 추가
      setInputValue(inputValue + value)
    }
  }



  const handleButtonClick = (increment: number) => {
    // 현재 inputValue를 숫자로 변환
    const currentValue = inputValue === '' ? 0 : parseInt(inputValue, 10)
    const newValue = Math.max(0, currentValue + increment) // 음수 방지
    setInputValue(newValue.toString())
  }

  const handleConfirm = () => {
    // inputValue를 만원 단위로 변환
    const numValue = inputValue === '' ? 0 : parseInt(inputValue, 10)
    onChange(numValue) // 만원 단위로 저장
    setIsExpanded(false)
  }

  const handleCancel = () => {
    setIsExpanded(false)
    setInputValue('')
  }

  // 일반 모드에서 표시할 값 포맷팅 (단위 포함)
  const formatDisplayValue = () => {
    if (value === 0) return '0만원'
    
    if (value >= 10000) {
      // 억 단위: 0.0억 형식
      const eok = value / 10000
      return `${eok.toFixed(1)}억`
    }
    // 만원 단위: 그대로 표시
    return `${value}만원`
  }

  // 확대 모드에서 표시할 값 (4자리 이상이면 0억 0000만원 형식)
  const formatExpandedValue = () => {
    if (inputValue === '') return '0만원'
    
    const numValue = parseInt(inputValue, 10) || 0
    // 10000 이상이면 억 단위로 표시 (0억 0000만원 형식)
    if (numValue >= 10000) {
      const eok = Math.floor(numValue / 10000)
      const manwon = numValue % 10000
      return `${eok}억 ${manwon.toString().padStart(4, '0')}만원`
    }
    // 1000 이상 10000 미만이면 4자리 패딩으로 표시
    if (numValue >= 1000) {
      return `${numValue.toString().padStart(4, '0')}만원`
    }
    return `${numValue}만원`
  }

  return (
    <>
      {/* 원래 input 컨테이너 - 확대 모드에서도 보이도록 유지 */}
      <div className="amount-input-container">
        <div 
          className="amount-input-row"
          onClick={handleInputClick}
        >
          <input
            type="text"
            readOnly
            className="amount-input"
            value={formatDisplayValue()}
            placeholder={placeholder || '0만원'}
          />
        </div>
      </div>

      {/* 확대 모드 오버레이 */}
      {isExpanded && (
        <div className="amount-input-expanded">
          <div 
            ref={expandedContentRef}
            className="amount-input-expanded-content"
          >
            <div className="amount-input-expanded-header">
              <button className="amount-cancel-button" onClick={handleCancel}>취소</button>
              <button className="amount-confirm-button" onClick={handleConfirm}>확인</button>
            </div>
            <div className="amount-input-expanded-display">
              <div className="amount-expanded-value">{formatExpandedValue() || '0만원'}</div>
              <button
                type="button"
                className="amount-delete-button"
                onClick={() => handleNumberPadClick('backspace')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="amount-buttons-expanded">
              <button
                type="button"
                className="amount-button-expanded"
                onClick={() => handleButtonClick(10)}
              >
                +10만
              </button>
              <button
                type="button"
                className="amount-button-expanded"
                onClick={() => handleButtonClick(100)}
              >
                +100만
              </button>
              <button
                type="button"
                className="amount-button-expanded"
                onClick={() => handleButtonClick(1000)}
              >
                +1000만
              </button>
              <button
                type="button"
                className="amount-button-expanded"
                onClick={() => handleButtonClick(10000)}
              >
                +1억
              </button>
              <button
                type="button"
                className="amount-button-expanded"
                onClick={() => handleButtonClick(-10)}
              >
                -10만
              </button>
              <button
                type="button"
                className="amount-button-expanded"
                onClick={() => handleButtonClick(-100)}
              >
                -100만
              </button>
              <button
                type="button"
                className="amount-button-expanded"
                onClick={() => handleButtonClick(-1000)}
              >
                -1000만
              </button>
              <button
                type="button"
                className="amount-button-expanded"
                onClick={() => handleButtonClick(-10000)}
              >
                -1억
              </button>
            </div>
            <div className="amount-number-pad">
              <div className="number-pad-row">
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('1')}
                >
                  1
                </button>
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('2')}
                >
                  2
                </button>
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('3')}
                >
                  3
                </button>
              </div>
              <div className="number-pad-row">
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('4')}
                >
                  4
                </button>
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('5')}
                >
                  5
                </button>
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('6')}
                >
                  6
                </button>
              </div>
              <div className="number-pad-row">
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('7')}
                >
                  7
                </button>
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('8')}
                >
                  8
                </button>
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('9')}
                >
                  9
                </button>
              </div>
              <div className="number-pad-row">
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('000')}
                >
                  000
                </button>
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('0')}
                >
                  0
                </button>
                <button
                  type="button"
                  className="number-pad-button"
                  onClick={() => handleNumberPadClick('0000')}
                >
                  0000
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AmountInput

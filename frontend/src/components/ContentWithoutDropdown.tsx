import './ContentWithoutDropdown.css'

interface ContentWithoutDropdownProps {
  label: string
  value?: string
  placeholder?: string
  type?: 'text' | 'date'
  onChange?: (value: string) => void
}

const ContentWithoutDropdown = ({ 
  label, 
  value = '', 
  placeholder = '',
  type = 'text',
  onChange 
}: ContentWithoutDropdownProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    // 날짜 형식 처리 (YYYY/MM/DD 형식 유지)
    if (type === 'date') {
      // HTML date input은 YYYY-MM-DD 형식을 사용하므로 변환 필요
      // 하지만 여기서는 텍스트 입력으로 처리
    }
    onChange?.(newValue)
  }

  return (
    <div className="content-without-dropdown">
      <label className="content-label">{label}</label>
      <div className="input-field">
        <input
          type={type === 'date' ? 'text' : type}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          className={`input-value ${!value ? 'placeholder' : ''}`}
        />
      </div>
    </div>
  )
}

export default ContentWithoutDropdown

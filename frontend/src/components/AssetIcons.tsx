// Asset Icons - Figma 디자인 기반 SVG 아이콘 컴포넌트

interface IconProps {
  className?: string
  style?: React.CSSProperties
  selected?: boolean
}

// 저축 아이콘: 연한 파란색 배경 위에 파란색 사각형 2개 (44*52)
export const SavingsIcon = ({ className, style, selected = false }: IconProps) => {
  const primaryColor = selected ? 'var(--bgwhite, #fcfcfc)' : 'var(--moneyblue, #4068ff)'
  const lightColor = selected ? 'rgba(252, 252, 252, 0.3)' : '#c7d3ff'
  
  return (
    <svg
      width="44"
      height="52"
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      style={style}
    >
      {/* 연한 파란색 배경 */}
      <rect x="21" y="36" width="44" height="31" rx="3" fill={lightColor} />
      {/* 파란색 사각형 1 */}
      <rect x="27" y="15" width="13" height="13" rx="2" fill={primaryColor} />
      {/* 파란색 사각형 2 */}
      <rect x="45" y="30" width="13" height="13" rx="2" fill={primaryColor} />
    </svg>
  )
}

// 투자 아이콘: 막대 그래프 (4개의 막대) (46*39)
export const InvestmentIcon = ({ className, style, selected = false }: IconProps) => {
  const primaryColor = selected ? 'var(--bgwhite, #fcfcfc)' : 'var(--moneyblue, #4068ff)'
  const lightColor = selected ? 'rgba(252, 252, 252, 0.3)' : '#c7d3ff'
  
  return (
    <svg
      width="46"
      height="39"
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      style={style}
    >
      {/* 막대 1 (가장 짧음) */}
      <rect x="20" y="47" width="10" height="13" rx="2" fill={primaryColor} />
      {/* 막대 2 */}
      <rect x="44" y="41" width="10" height="19" rx="2" fill={primaryColor} />
      {/* 막대 3 (연한 파란색) */}
      <rect x="32" y="33" width="10" height="27" rx="2" fill={lightColor} />
      {/* 막대 4 (가장 김, 연한 파란색) */}
      <rect x="56" y="21" width="10" height="39" rx="2" fill={lightColor} />
    </svg>
  )
}

// 유형자산 아이콘: 집 모양 (3개의 건물 + 창문과 문) (52*46)
export const TangibleAssetIcon = ({ className, style, selected = false }: IconProps) => {
  const primaryColor = selected ? 'var(--bgwhite, #fcfcfc)' : 'var(--moneyblue, #4068ff)'
  const lightColor = selected ? 'rgba(252, 252, 252, 0.3)' : '#c7d3ff'
  
  return (
    <svg
      width="52"
      height="46"
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      style={style}
    >
      {/* 배경 건물 1 (가운데, 가장 큼) */}
      <rect x="26" y="18" width="32" height="46" rx="3" fill={lightColor} />
      {/* 배경 건물 2 (왼쪽) */}
      <rect x="16" y="40" width="32" height="24" rx="3" fill={lightColor} />
      {/* 배경 건물 3 (오른쪽) */}
      <rect x="36" y="33" width="32" height="31" rx="3" fill={lightColor} />
      {/* 창문 1 (왼쪽 위) */}
      <rect x="31" y="22" width="9" height="9" rx="2" fill={primaryColor} />
      {/* 창문 2 (오른쪽 위) */}
      <rect x="44" y="22" width="9" height="9" rx="2" fill={primaryColor} />
      {/* 창문 3 (왼쪽 아래) */}
      <rect x="31" y="35" width="9" height="9" rx="2" fill={primaryColor} />
      {/* 창문 4 (오른쪽 아래) */}
      <rect x="44" y="35" width="9" height="9" rx="2" fill={primaryColor} />
      {/* 문 */}
      <rect x="37" y="54" width="10" height="10" rx="2" fill={primaryColor} />
    </svg>
  )
}

// 부채 아이콘: 연한 파란색 배경 위에 파란색 사각형 2개 (44*45)
export const DebtIcon = ({ className, style, selected = false }: IconProps) => {
  const primaryColor = selected ? 'var(--bgwhite, #fcfcfc)' : 'var(--moneyblue, #4068ff)'
  const lightColor = selected ? 'rgba(252, 252, 252, 0.3)' : '#c7d3ff'
  
  return (
    <svg
      width="44"
      height="45"
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      style={style}
    >
      {/* 연한 파란색 배경 */}
      <rect x="20" y="18" width="44" height="31" rx="3" fill={lightColor} />
      {/* 파란색 사각형 1 */}
      <rect x="31" y="43" width="9" height="9" rx="2" fill={primaryColor} />
      {/* 파란색 사각형 2 */}
      <rect x="43" y="54" width="9" height="9" rx="2" fill={primaryColor} />
    </svg>
  )
}


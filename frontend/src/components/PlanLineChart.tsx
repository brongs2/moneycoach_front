import React, { useEffect, useMemo, useRef, useState } from 'react'

type Marker = {
  label: string
  index: number
  color?: string
}

interface PlanLineChartProps {
  labels: string[]
  values: number[] // 만원 단위 등 동일 스케일 값
  height?: number
  paddingX?: number
  paddingY?: number
  strokeColor?: string
  markerColor?: string
  retirementYear?: number
  expectedDeathYear?: number
  className?: string
  placeholder?: React.ReactNode
}

const DEFAULT_HEIGHT = 180
const DEFAULT_PADDING = 24

function buildMarkers(labels: string[], currentYear = 2026, retirementYear?: number, deathYear?: number): Marker[] {
  const markers: Marker[] = []
  const findIndex = (year?: number) =>
    year !== undefined ? labels.findIndex((l) => l === String(year)) : -1

  const currentIndex = findIndex(currentYear)
  if (currentIndex >= 0) markers.push({ label: '현재', index: currentIndex })

  const retireIndex = findIndex(retirementYear)
  if (retireIndex >= 0) markers.push({ label: '은퇴', index: retireIndex })

  const deathIndex = findIndex(deathYear)
  if (deathIndex >= 0) markers.push({ label: '예상수명', index: deathIndex })

  return markers
}

const PlanLineChart: React.FC<PlanLineChartProps> = ({
  labels,
  values,
  height = DEFAULT_HEIGHT,
  paddingX = DEFAULT_PADDING,
  paddingY = DEFAULT_PADDING,
  strokeColor = 'var(--moneyblue, #4068ff)',
  markerColor = 'var(--moneyblue, #4068ff)',
  retirementYear,
  expectedDeathYear,
  className,
  placeholder = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  // 폭 측정
  useEffect(() => {
    const update = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth)
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const points = useMemo(() => {
    const len = Math.min(labels.length, values.length)
    if (width === 0 || len === 0) return { pts: [], max: 0 }
    const innerWidth = Math.max(0, width - paddingX * 2)
    const innerHeight = Math.max(0, height - paddingY * 2)
    const sliceLabels = labels.slice(0, len)
    const sliceValues = values.slice(0, len)
    // 새로운 Y스케일: min/max 모두 고려, 음수 지원
    const maxVal = Math.max(...sliceValues)
    const minVal = Math.min(...sliceValues)
    // 값이 모두 같으면(수평선) 범위를 만들어 0으로 나누는 상황을 방지
    const range = maxVal === minVal ? 1 : maxVal - minVal
    // maxVal가 위쪽(작은 y), minVal가 아래쪽(큰 y)로 가도록 매핑
    const pts = sliceValues.map((v, i) => {
      const x = paddingX + (len === 1 ? innerWidth / 2 : (innerWidth * i) / (len - 1))
      const y = paddingY + ((maxVal - v) / range) * innerHeight
      return { x, y }
    })
    return { pts, max: maxVal, labels: sliceLabels }
  }, [labels, values, width, paddingX, paddingY, height])

  if (width === 0) {
    return <div ref={containerRef} className={className} style={{ width: '100%', height }} />
  }

  if (points.pts.length === 0) {
    return (
      <div ref={containerRef} className={className} style={{ width: '100%', height, position: 'relative' }}>
        {placeholder}
      </div>
    )
  }

  const markers = buildMarkers(labels, 2026, retirementYear, expectedDeathYear)

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', height, position: 'relative' }}>
      <svg width={width} height={height}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          points={points.pts.map((p) => `${p.x},${p.y}`).join(' ')}
        />
        {markers.map((m, idx) => {
          const pt = points.pts[m.index]
          if (!pt) return null
          return (
            <g key={`${m.label}-${idx}`}>
              <circle cx={pt.x} cy={pt.y} r={6} fill="#fff" stroke={markerColor} strokeWidth={2} />
              <circle cx={pt.x} cy={pt.y} r={3.5} fill={markerColor} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default PlanLineChart
export { buildMarkers }


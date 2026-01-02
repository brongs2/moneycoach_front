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

  // 왼쪽 여백을 더 크게 잡아서(금액 라벨/점 겹침 방지) 그래프/축 시작을 오른쪽으로 이동
  const plotLeft = paddingX + 38
  const plotRight = paddingX

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
    if (width === 0 || len === 0) return { pts: [], max: 0, min: 0, range: 1, labels: [], values: [], years: [] }
    const innerWidth = Math.max(0, width - plotLeft - plotRight)
    const innerHeight = Math.max(0, height - paddingY * 2)
    const sliceLabels = labels.slice(0, len)
    const sliceValues = values.slice(0, len)

    // 연도 숫자 추출
    const yearNums = sliceLabels.map((l) => {
      const n = Number(String(l))
      return Number.isFinite(n) ? n : NaN
    })
    const firstYear = yearNums.find((n) => Number.isFinite(n))
    const lastYear = [...yearNums].reverse().find((n) => Number.isFinite(n))
    if (firstYear === undefined || lastYear === undefined) {
      return { pts: [], max: 0, min: 0, range: 1, labels: sliceLabels, values: sliceValues, years: yearNums }
    }
    // 데케이드 도메인 확장
    const decadeStart = Math.floor(firstYear / 10) * 10
    const decadeEndRaw = Math.ceil(lastYear / 10) * 10
    const decadeEnd = decadeEndRaw === decadeStart ? decadeStart + 10 : decadeEndRaw
    const domainSpan = Math.max(1, decadeEnd - decadeStart)
    const scaleX = (year: number) => plotLeft + ((year - decadeStart) / domainSpan) * innerWidth

    // 새로운 Y스케일: min/max 모두 고려, 음수 지원
    const maxVal = Math.max(...sliceValues)
    const minVal = Math.min(...sliceValues)
    const range = maxVal === minVal ? 1 : maxVal - minVal

    const pts = sliceValues.map((v, i) => {
      const yr = Number.isFinite(yearNums[i]) ? yearNums[i] : firstYear + i
      let x = scaleX(yr)
      // 첫 포인트만 10px 오른쪽으로 이동 (마지막 포인트는 고정)
      if (i === 0) {
        const maxX = plotLeft + innerWidth
        x = Math.min(maxX, x + 10)
      }
      const y = paddingY + ((maxVal - v) / range) * innerHeight
      return { x, y }
    })
    return { pts, max: maxVal, min: minVal, range, labels: sliceLabels, values: sliceValues, years: yearNums, decadeStart, decadeEnd, scaleX }
  }, [labels, values, width, paddingX, paddingY, height, plotLeft, plotRight])

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

  const currentYear = 2026
  const markers = buildMarkers(labels, currentYear, retirementYear, expectedDeathYear)
  const innerWidth = Math.max(0, width - plotLeft - plotRight)
  const innerHeight = Math.max(0, height - paddingY * 2)

  const isYearLabel = (l: string) => /^\d{4}$/.test(String(l))

  const formatManWon = (v: number) => {
    const sign = v < 0 ? '-' : ''
    const abs = Math.abs(v)
    if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(1)}억`
    return `${sign}${abs.toFixed(0)}만`
  }

  // Y축은 직접 그리지 않고, 가로 점선 + 금액 라벨로 표현
  const gridCount = 4 as number
  const yTicks = Array.from({ length: gridCount }, (_, i) => {
    const t = i / (gridCount - 1)
    const y = paddingY + t * innerHeight
    const value = points.max - t * points.range
    return { y, value }
  })

  // 왼쪽 금액 라벨이 첫 점과 겹치지 않도록: 라벨은 오른쪽 기준(end)으로 두고,
  // 점선(grid)은 라벨보다 오른쪽에서 시작
  const gridX1 = plotLeft + 8
  const gridX2 = plotLeft + innerWidth
  const yLabelX = plotLeft - 10

  // X축(년도) 라벨: 10년 간격(데케이드)으로 표시.
  // 도메인: decadeStart~decadeEnd 로 확장, 첫 점보다 왼쪽(예: 2020)에서 시작.
  const yearNums = points.years
  const firstYear = yearNums.find((n) => Number.isFinite(n))
  const lastYear = [...yearNums].reverse().find((n) => Number.isFinite(n))
  const decadeStart = points.decadeStart ?? (firstYear !== undefined ? Math.floor(firstYear / 10) * 10 : 0)
  const decadeEnd = points.decadeEnd ?? (lastYear !== undefined ? Math.ceil(lastYear / 10) * 10 : decadeStart + 10)
  const scaleX = points.scaleX ?? ((y: number) => {
    const innerWidth = Math.max(0, width - plotLeft - plotRight)
    const span = Math.max(1, decadeEnd - decadeStart)
    return plotLeft + ((y - decadeStart) / span) * innerWidth
  })

  const decadeYears: number[] = []
  for (let y = decadeStart; y <= decadeEnd; y += 10) decadeYears.push(y)

  let xAxisTicks = decadeYears
    .map((year) => ({ year, x: scaleX(year) }))
    // 현재년도는 칩으로 보여주므로 X축 라벨에서 제외
    .filter((t) => t.year !== currentYear)
    // 마지막 데이터의 년도 라벨은 표시하지 않음
    .filter((t) => t.year !== lastYear)
    // 범위 밖은 제거
    .filter((t) => t.x >= plotLeft && t.x <= plotLeft + Math.max(0, width - plotLeft - plotRight))

  // 비어 있으면 시작 데케이드는 하나 표시
  if (xAxisTicks.length === 0 && decadeYears.length > 0) {
    xAxisTicks = [{ year: decadeYears[0], x: scaleX(decadeYears[0]) }]
  }

  const lastIdx = points.pts.length - 1
  const maxIdx = points.values.reduce((best, v, i, arr) => (v > (arr[best] ?? -Infinity) ? i : best), 0)
  const minIdx = points.values.reduce((best, v, i, arr) => (v < (arr[best] ?? Infinity) ? i : best), 0)
  const importantIdxSet = new Set<number>([0, lastIdx, maxIdx, minIdx])

  return (
  <div ref={containerRef} className={className} style={{ width: '100%', height, position: 'relative' }}>
    <svg width={width} height={height}>
      {/* 가로 점선(Grid) + 금액 라벨 */}
      <g>
        {yTicks.map((t, i) => (
          <g key={`grid-${i}`}>
            <line
              x1={gridX1}
              y1={t.y}
              x2={gridX2}
              y2={t.y}
              stroke="rgba(0,0,0,0.12)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={yLabelX}
              y={t.y}
              dy={3}
              fontSize={10}
              fill="rgba(0,0,0,0.45)"
              textAnchor="end"
            >
              {formatManWon(t.value)}
            </text>
          </g>
        ))}
      </g>

      {/* 라인 */}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.pts.map((p) => `${p.x},${p.y}`).join(' ')}
      />

      {/* 포인트 + (년도+금액) 말풍선 */}
      <g>
        {points.pts.map((pt, i) => {
          const isImportant = importantIdxSet.has(i)
          if (!isImportant) return null
          const rawLabel = points.labels[i] ?? labels[i] ?? ''
          const yearText = isYearLabel(String(rawLabel)) ? `${rawLabel}년` : String(rawLabel)
          const valueText = formatManWon(points.values[i] ?? 0)
          const calloutText = `${yearText} ${valueText}`

          const estW = Math.max(44, calloutText.length * 6.2 + 12)
          const h = 18

          // X축 라벨과 겹치지 않도록: 항상 위쪽에 배치
          const baseY = pt.y - 28
          const y = Math.max(2, Math.min(baseY, height - h - 2))

          // 좌우 클램프
          const x = Math.max(2, Math.min(pt.x - estW / 2, width - estW - 2))

          return (
            <g key={`pt-${i}`}>
              <circle cx={pt.x} cy={pt.y} r={6} fill="#fff" stroke={markerColor} strokeWidth={2} />
              <circle cx={pt.x} cy={pt.y} r={3.5} fill={markerColor} />

              <rect
                x={x}
                y={y}
                width={estW}
                height={h}
                rx={9}
                ry={9}
                fill="#fff"
                stroke="rgba(0,0,0,0.10)"
              />
              <text
                x={x + estW / 2}
                y={y + 12}
                textAnchor="middle"
                fontSize={10}
                fill="rgba(0,0,0,0.65)"
              >
                {calloutText}
              </text>
            </g>
          )
        })}
      </g>

      {/* 기존 마커(현재/은퇴/예상수명) */}
      {markers.map((m, idx) => {
        const pt = points.pts[m.index]
        if (!pt) return null
        return (
          <g key={`${m.label}-${idx}`}>
            <circle cx={pt.x} cy={pt.y} r={7} fill="#fff" stroke={markerColor} strokeWidth={2} />
            <circle cx={pt.x} cy={pt.y} r={4} fill={markerColor} />
          </g>
        )
      })}

      {/* X축(년도) 라벨 */}
      <g>
        {xAxisTicks.map((t) => {
          return (
            <text
              key={`x-${t.year}`}
              x={t.x}
              y={height - 6}
              textAnchor="middle"
              fontSize={10}
              fill="rgba(0,0,0,0.45)"
            >
              {String(t.year)}
            </text>
          )
        })}
      </g>
    </svg>
  </div>
  )
}

export default PlanLineChart
export { buildMarkers }


// PlanSetGoal.tsx  (smooth 버전 + title 중복 방지 포함)
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import type { PlanGoalData } from '../types/plan'

import StatusBar from '../components/StatusBar'
import ContentBlueButton from '../components/ContentBlueButton'
import './PlanSetGoal.css'

import { ensureToken } from '../utils/auth'
import { fetchPlanTitles } from '../utils/planApi'

interface PlanSetGoalProps {
  initialValue?: PlanGoalData
  onNext?: (data: PlanGoalData) => void
  onBack?: () => void
}

const AUTO_SCROLL_LOCK_MS = 220

// ✅ 중복 없는 제목 만들기 ("제목", "제목 1", "제목 2"...)
function generateUniqueTitle(baseTitle: string, existingTitles: string[]): string {
  const base = (baseTitle ?? '').trim() || 'My Plan'
  const normalized = new Set(existingTitles.map((t) => (t ?? '').trim()))
  if (!normalized.has(base)) return base

  let i = 1
  while (normalized.has(`${base} ${i}`)) i += 1
  return `${base} ${i}`
}

const PlanSetGoal = ({ initialValue, onNext, onBack }: PlanSetGoalProps) => {
  // ✅ API는 vite proxy 기준
  const API = '/api'

  const [title, setTitle] = useState(initialValue?.title ?? '')
  const [description, setDescription] = useState(initialValue?.description ?? '')
  const [age, setAge] = useState(initialValue?.age ? String(initialValue.age) : '')
  const [assetType, setAssetType] = useState(initialValue?.assetType ?? '')
  const [multiplier, setMultiplier] = useState(initialValue?.multiplier ? `${initialValue.multiplier}배` : '')
  const [action, setAction] = useState(initialValue?.action ?? '')

  const [showAssetDropdown, setShowAssetDropdown] = useState(false)
  const [showMultiplierDropdown, setShowMultiplierDropdown] = useState(false)
  const [showActionDropdown, setShowActionDropdown] = useState(false)

  const assetOptions = ['현재 자산', '저축', '투자', '유형자산', '부채']
  const multiplierOptions = ['1배', '2배', '3배', '5배', '10배']
  const actionOptions = ['확장 시키겠습니다', '유지하겠습니다', '감소시키겠습니다']

  const isTitleFilled = title.trim() !== ''
  const isAgeFilled = age !== ''
  const isAssetTypeFilled = assetType !== ''
  const isMultiplierFilled = multiplier !== ''
  const isActionFilled = action !== ''
  const isAllFilled =
    isTitleFilled && isAgeFilled && isAssetTypeFilled && isMultiplierFilled && isActionFilled

  const formRef = useRef<HTMLDivElement>(null)
  const planContentRef = useRef<HTMLDivElement>(null)
  const actionDropdownRef = useRef<HTMLDivElement>(null)

  // ✅ smooth 중 사용자 개입으로 인한 "따닥" 방지 잠금
  const isAutoScrollingRef = useRef(false)
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)

  const setAutoScrolling = (v: boolean) => {
    isAutoScrollingRef.current = v
    setIsAutoScrolling(v)
  }

  // ✅ titles 로딩 + title 자동 보정 (1회)
  const didInitTitleRef = useRef(false)
  useEffect(() => {
    if (didInitTitleRef.current) return
    didInitTitleRef.current = true

    ;(async () => {
      try {
        const token = await ensureToken(API)

        // ⚠️ fetchPlanTitles 시그니처에 따라 2줄 중 하나만 사용
        const data = await fetchPlanTitles(API, token) // { titles: string[] }
        // const data = await fetchPlanTitles(API)

        const titles = data?.titles ?? []

        // base title 우선순위:
        // 1) initialValue.title (있으면 존중)
        // 2) 없으면 기본 "My Plan"
        const base = (initialValue?.title ?? 'My Plan').trim() || 'My Plan'

        const unique = generateUniqueTitle(base, titles)

        // 사용자가 이미 타이핑 중이면 덮어쓰지 않도록,
        // 초기값이 비어있거나, 초기값과 같은 경우에만 자동 적용
        setTitle((prev) => {
          const prevTrim = (prev ?? '').trim()
          if (!prevTrim) return unique
          if (initialValue?.title && prevTrim === initialValue.title.trim()) return unique
          return prev
        })
      } catch (e) {
        console.error('fetchPlanTitles failed (PlanSetGoal)', e)
        // 실패해도 UX 유지: title이 비어있으면 기본값만 채워줌
        setTitle((prev) => (prev.trim() ? prev : (initialValue?.title ?? 'My Plan')))
      }
    })()
  }, [API, initialValue?.title])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowAssetDropdown(false)
        setShowMultiplierDropdown(false)
        setShowActionDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const closeOthers = (keep: 'asset' | 'multiplier' | 'action') => {
    if (keep !== 'asset') setShowAssetDropdown(false)
    if (keep !== 'multiplier') setShowMultiplierDropdown(false)
    if (keep !== 'action') setShowActionDropdown(false)
  }

  // "열릴 때 1회만" 스크롤 보정
  const didAdjustRef = useRef(false)
  const unlockTimerRef = useRef<number | null>(null)

  const lockDuringSmooth = () => {
    setAutoScrolling(true)
    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current)
    unlockTimerRef.current = window.setTimeout(() => {
      setAutoScrolling(false)
      unlockTimerRef.current = null
    }, AUTO_SCROLL_LOCK_MS)
  }

  useLayoutEffect(() => {
    if (!showActionDropdown) {
      didAdjustRef.current = false
      if (unlockTimerRef.current) {
        window.clearTimeout(unlockTimerRef.current)
        unlockTimerRef.current = null
      }
      setAutoScrolling(false)
      return
    }

    if (!actionDropdownRef.current || !planContentRef.current) return
    if (didAdjustRef.current) return
    if (isAutoScrollingRef.current) return

    requestAnimationFrame(() => {
      const dropdown = actionDropdownRef.current
      const container = planContentRef.current
      if (!dropdown || !container) return

      const dropdownRect = dropdown.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const overflow = dropdownRect.bottom - containerRect.bottom

      if (overflow > 1) {
        didAdjustRef.current = true
        lockDuringSmooth()
        container.scrollBy({ top: overflow + 10, behavior: 'smooth' })
      } else {
        didAdjustRef.current = true
      }
    })
  }, [showActionDropdown])

  const parseMultiplier = (text: string) => {
    const n = Number(String(text).replace(/[^\d.]/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  const handleNext = () => {
    if (!isAllFilled) return

    const ageNum = Number(age)
    const mulNum = parseMultiplier(multiplier)

    if (!Number.isFinite(ageNum) || ageNum <= 0) return
    if (!Number.isFinite(mulNum) || mulNum <= 0) return

    onNext?.({
      title: title.trim(),
      description: description.trim(),
      age: ageNum,
      assetType,
      multiplier: mulNum,
      action,
    })
  }

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current)
    }
  }, [])

  // 스크롤 중 wheel/touch 막기
  useEffect(() => {
    const el = planContentRef.current
    if (!el) return

    const prevent = (e: Event) => {
      if (isAutoScrollingRef.current) e.preventDefault()
    }

    el.addEventListener('wheel', prevent, { passive: false })
    el.addEventListener('touchmove', prevent, { passive: false })

    return () => {
      el.removeEventListener('wheel', prevent as any)
      el.removeEventListener('touchmove', prevent as any)
    }
  }, [])

  return (
    <div className="plan-set-goal">
      <div className="setup-container">
        <div className="setup-header">
          <StatusBar />
        </div>

        <div className="setup-back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div
          className="setup-content"
          ref={planContentRef}
          style={{ pointerEvents: isAutoScrolling ? 'none' : 'auto' }}
        >
          <div className="setup-top">
            <div className="plan-title-wrapper">
              <input
                type="text"
                className="plan-title-input"
                placeholder="플랜 이름"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="plan-description-input"
                placeholder="플랜에 대한 간단한 설명 작성하기"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={1}
              />
            </div>
          </div>

          <div className="setup-form" ref={formRef}>
            <div className="plan-form">
              {/* age */}
              <div className="plan-form-item">
                <div className="plan-input-wrapper plan-input-age">
                  <div className="plan-input-line" />
                  <input
                    type="text"
                    className={`plan-input ${isAgeFilled ? 'filled' : ''}`}
                    placeholder="2025"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <span className="plan-label">년까지</span>
              </div>

              {/* asset */}
              <div className="plan-form-item">
                <div className="plan-input-wrapper plan-input-asset">
                  <div className="plan-input-line" />
                  <input
                    type="text"
                    className={`plan-input ${isAssetTypeFilled ? 'filled' : ''}`}
                    placeholder="현재 자산"
                    value={assetType}
                    readOnly
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowAssetDropdown((v) => !v)
                      closeOthers('asset')
                    }}
                  />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="plan-chevron">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  {showAssetDropdown && (
                    <div className="plan-dropdown">
                      {assetOptions.map((option) => (
                        <div
                          key={option}
                          className="plan-dropdown-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setAssetType(option)
                            setShowAssetDropdown(false)
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="plan-label">의</span>
              </div>

              {/* multiplier */}
              <div className="plan-form-item">
                <div className="plan-input-wrapper plan-input-multiplier">
                  <div className="plan-input-line" />
                  <input
                    type="text"
                    className={`plan-input ${isMultiplierFilled ? 'filled' : ''}`}
                    placeholder="00배"
                    value={multiplier}
                    readOnly
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowMultiplierDropdown((v) => !v)
                      closeOthers('multiplier')
                    }}
                  />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="plan-chevron">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  {showMultiplierDropdown && (
                    <div className="plan-dropdown">
                      {multiplierOptions.map((option) => (
                        <div
                          key={option}
                          className="plan-dropdown-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setMultiplier(option)
                            setShowMultiplierDropdown(false)
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="plan-label">만큼</span>
              </div>

              {/* action */}
              <div className="plan-form-item">
                <div className="plan-input-wrapper plan-input-action">
                  <div className="plan-input-line" />
                  <input
                    type="text"
                    className={`plan-input ${isActionFilled ? 'filled' : ''}`}
                    placeholder="확장 시키겠습니다"
                    value={action}
                    readOnly
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowActionDropdown((v) => !v)
                      closeOthers('action')
                    }}
                  />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="plan-chevron">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  {showActionDropdown && (
                    <div className="plan-dropdown" ref={actionDropdownRef}>
                      {actionOptions.map((option) => (
                        <div
                          key={option}
                          className="plan-dropdown-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setAction(option)
                            setShowActionDropdown(false)
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="setup-bottom">
            <ContentBlueButton
              label="다음"
              onClick={handleNext}
              style={{
                visibility: isAllFilled ? 'visible' : 'hidden',
                opacity: isAllFilled ? 1 : 0,
                pointerEvents: isAllFilled ? 'auto' : 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlanSetGoal

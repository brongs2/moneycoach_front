// PlanSetGoal.tsx  (smooth 버전: 중복/따닥 방지 포함)
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import type { PlanGoalData } from '../types/plan'

import StatusBar from '../components/StatusBar'
import ContentBlueButton from '../components/ContentBlueButton'
import './PlanSetGoal.css'

interface PlanSetGoalProps {
  initialValue?: PlanGoalData
  onNext?: (data: PlanGoalData) => void   // ✅ 핵심
  onBack?: () => void
}

const AUTO_SCROLL_LOCK_MS = 220 // smooth 스크롤이 끝날 정도로만 "짧게" 잠금

const PlanSetGoal = ({ initialValue, onNext, onBack }: PlanSetGoalProps) => {
  const [title, setTitle] = useState(initialValue?.title ?? '')
  const [description, setDescription] = useState(initialValue?.description ?? '')
  const [age, setAge] = useState(initialValue?.age ? String(initialValue.age) : '')
  const [assetType, setAssetType] = useState(initialValue?.assetType ?? '')
  const [multiplier, setMultiplier] = useState(
    initialValue?.multiplier ? `${initialValue.multiplier}배` : ''
  )
  const [action, setAction] = useState(initialValue?.action ?? '')

  const [showAssetDropdown, setShowAssetDropdown] = useState(false)
  const [showMultiplierDropdown, setShowMultiplierDropdown] = useState(false)
  const [showActionDropdown, setShowActionDropdown] = useState(false)

  const assetOptions = ['현재 자산', '저축', '투자', '유형자산', '부채']
  const multiplierOptions = ['1배', '2배', '3배', '5배', '10배']
  const actionOptions = ['확장 시키겠습니다', '유지하겠습니다', '감소시키겠습니다']

  const isTitleFilled = title.trim() !== ''
  const isDescriptionFilled = description.trim() !== ''
  const isAgeFilled = age !== ''
  const isAssetTypeFilled = assetType !== ''
  const isMultiplierFilled = multiplier !== ''
  const isActionFilled = action !== ''
  const isAllFilled = isTitleFilled && isDescriptionFilled && isAgeFilled && isAssetTypeFilled && isMultiplierFilled && isActionFilled

  const formRef = useRef<HTMLDivElement>(null)
  const planContentRef = useRef<HTMLDivElement>(null)
  const actionDropdownRef = useRef<HTMLDivElement>(null)

  // ✅ smooth 중 사용자 개입(클릭/호버 등)으로 인한 "따닥" 방지용 잠금
  const isAutoScrollingRef = useRef(false)
  const [isAutoScrolling, setIsAutoScrolling] = useState(false) // UI(pointerEvents) 제어용

  const setAutoScrolling = (v: boolean) => {
    isAutoScrollingRef.current = v
    setIsAutoScrolling(v)
  }

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

  // ✅ "열릴 때 1회만" 스크롤 보정
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
      // 드롭다운 닫히면 잠금도 해제
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

    // 렌더/레이아웃 확정 후 계산
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
    // '3배' -> 3
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

  // ✅ 스크롤 중에는 휠/터치 스크롤도 막아서 "중첩 smooth"를 확실히 방지
  useEffect(() => {
    const el = planContentRef.current
    if (!el) return

    const prevent = (e: Event) => {
      if (isAutoScrollingRef.current) {
        e.preventDefault()
      }
    }

    // passive: false 로 preventDefault 가능하게
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
            <path
              d="M15 18L9 12L15 6"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div
          className="setup-content"
          ref={planContentRef}
          // ✅ smooth 진행 중 클릭/호버로 레이아웃/포커스가 흔들리지 않게 잠깐 차단
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
                    placeholder="00"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <span className="plan-label">세까지</span>
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
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  {showAssetDropdown && (
                    <div className="plan-dropdown">
                      {assetOptions.map((option) => (
                        <div
                          key={option}
                          className="plan-dropdown-item"
                          onMouseDown={(e) => e.preventDefault()} // ✅ 포커스/자동스크롤 방지
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
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  {showMultiplierDropdown && (
                    <div className="plan-dropdown">
                      {multiplierOptions.map((option) => (
                        <div
                          key={option}
                          className="plan-dropdown-item"
                          onMouseDown={(e) => e.preventDefault()} // ✅ 포커스/자동스크롤 방지
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
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  {showActionDropdown && (
                    <div className="plan-dropdown" ref={actionDropdownRef}>
                      {actionOptions.map((option) => (
                        <div
                          key={option}
                          className="plan-dropdown-item"
                          onMouseDown={(e) => e.preventDefault()} // ✅ 따닥 방지 핵심
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

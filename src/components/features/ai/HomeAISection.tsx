'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from 'next-intl'
import { useAssistantStore } from '@/lib/ai/store'
import { addRecommendedPlaceToBacklog } from '@/app/actions/backlog'
import { getCategoryStyle } from '@/utils/placeCategory'
import PlacePhoto from '@/components/features/places/PlacePhoto'
import type { RecommendResult } from '@/app/api/ai/recommend/route'

type SaveState = 'idle' | 'loading' | 'saved' | 'exists' | 'error'

export default function HomeAISection() {
  const locale = useLocale() as 'ko' | 'en'
  const isKo = locale === 'ko'
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RecommendResult | null>(null)
  const [error, setError] = useState(false)
  const [saveStates, setSaveStates] = useState<Record<number, SaveState>>({})
  const [photoRefs, setPhotoRefs] = useState<Record<number, string | null>>({})
  const abortRef = useRef<AbortController | null>(null)
  const openAssistant = useAssistantStore((s) => s.open)

  async function fetchRecommend() {
    if (loading) return
    setError(false)
    setLoading(true)
    setResult(null)
    setSaveStates({})
    setPhotoRefs({})
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
        signal: abortRef.current.signal,
      })
      if (!res.ok) throw new Error('failed')
      const data: RecommendResult = await res.json()
      setResult(data)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError(true)
    } finally {
      setLoading(false)
    }
  }

  // AI 결과 뜨면 장소 사진 병렬 패치
  useEffect(() => {
    if (!result) return
    const controller = new AbortController()

    Promise.all(
      result.places.map(async (place, idx) => {
        try {
          const res = await fetch(
            `/api/places/search?q=${encodeURIComponent(place.googleSearchQuery)}`,
            { signal: controller.signal },
          )
          if (!res.ok) return
          const data = await res.json()
          const photoRef: string | null = data.places?.[0]?.photos?.[0]?.name ?? null
          setPhotoRefs((prev) => ({ ...prev, [idx]: photoRef }))
        } catch {
          // 사진 실패는 무시 — 이모지 폴백
        }
      }),
    )

    return () => controller.abort()
  }, [result])

  function handleOpen() {
    setOpen(true)
    if (!result && !loading) fetchRecommend()
  }

  function handleClose() {
    abortRef.current?.abort()
    setOpen(false)
  }

  async function handleSave(idx: number) {
    if (!result) return
    const place = result.places[idx]
    setSaveStates((prev) => ({ ...prev, [idx]: 'loading' }))
    const res = await addRecommendedPlaceToBacklog({
      googleSearchQuery: place.googleSearchQuery,
      fallbackName: place.name,
      category: place.category,
    })
    if (res.alreadyExists) {
      setSaveStates((prev) => ({ ...prev, [idx]: 'exists' }))
    } else if (res.success) {
      setSaveStates((prev) => ({ ...prev, [idx]: 'saved' }))
    } else {
      setSaveStates((prev) => ({ ...prev, [idx]: 'error' }))
    }
  }

  function handleAskForTrip() {
    if (!result) return
    const names = result.places
      .slice(0, 5)
      .map((p) => p.name)
      .join(', ')
    const prompt = isKo
      ? `AI가 추천해준 이 장소들로 여행 일정 만들어줘: ${names}`
      : `Create a travel itinerary with these AI-recommended places: ${names}`
    handleClose()
    openAssistant({ prompt })
  }

  return (
    <>
      {/* 배너 버튼 */}
      <button
        onClick={handleOpen}
        className="relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl p-4 text-left transition-opacity active:opacity-90"
        style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)' }}
      >
        <svg
          aria-hidden
          viewBox="0 0 48 48"
          style={{ position: 'absolute', right: -8, top: -10, width: 72, height: 72, opacity: 0.15 }}
        >
          <g transform="translate(10 9)">
            <path d="M3 24L23 4L18 24L12 17Z" fill="white" />
            <path d="M17 25L20 30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
          <span className="text-[22px]">✨</span>
        </div>
        <div className="relative flex-1">
          <p className="text-[14px] font-bold text-white">
            {isKo ? 'AI 취향 추천' : 'AI Recommendations'}
          </p>
          <p className="text-[12px] text-white/60">
            {isKo ? '백로그·좋아요 기반으로 딱 맞는 장소' : 'Places matched to your taste'}
          </p>
        </div>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0">
          <path
            d="M7 4l5 5-5 5"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[80] bg-black/40" onClick={handleClose} />
            <div className="fixed inset-x-0 bottom-0 z-[81] flex max-h-[80dvh] flex-col rounded-t-3xl bg-white">
              {/* 핸들 */}
              <div className="flex flex-shrink-0 justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-gray-200" />
              </div>

              {/* 헤더 */}
              <div className="flex flex-shrink-0 items-center justify-between px-5 pt-1 pb-3">
                <div>
                  <p className="text-ink text-[17px] font-bold">
                    {isKo ? '✨ AI 취향 추천' : '✨ AI Recommendations'}
                  </p>
                  <p className="text-ink3 text-[12px]">
                    {isKo ? '나의 취향 기반 맞춤 장소' : 'Personalized to your taste'}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M1 1l12 12M13 1L1 13"
                      stroke="#666"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="bg-border h-px flex-shrink-0" />

              {/* 콘텐츠 */}
              <div className="flex-1 overflow-y-auto">
                {/* 로딩 */}
                {loading && (
                  <div className="flex flex-col items-center justify-center gap-3 px-5 py-12">
                    <div className="border-primary h-7 w-7 animate-spin rounded-full border-2 border-t-transparent" />
                    <p className="text-ink3 text-[13px]">
                      {isKo ? 'AI가 취향을 분석 중이에요...' : 'Analyzing your preferences...'}
                    </p>
                  </div>
                )}

                {/* 에러 */}
                {error && !loading && (
                  <div className="flex flex-col items-center gap-4 px-5 py-12">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                          stroke="#999"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-ink text-[15px] font-semibold">
                        {isKo ? '추천을 불러오지 못했어요' : 'Failed to load'}
                      </p>
                      <p className="text-ink3 mt-1 text-[13px]">
                        {isKo ? '잠시 후 다시 시도해주세요' : 'Please try again later'}
                      </p>
                    </div>
                    <button
                      onClick={fetchRecommend}
                      className="bg-primary rounded-2xl px-6 py-2.5 text-[14px] font-semibold text-white"
                    >
                      {isKo ? '다시 시도' : 'Retry'}
                    </button>
                  </div>
                )}

                {/* 결과 */}
                {result && !loading && (
                  <>
                    {/* 인트로 */}
                    <div className="px-5 py-3.5">
                      <p className="text-ink2 text-[13px] leading-relaxed">{result.intro}</p>
                    </div>

                    <div className="bg-border mx-5 h-px" />

                    {/* 장소 카드 리스트 */}
                    <div className="divide-y divide-[#F5F5F5] px-5">
                      {result.places.map((place, idx) => {
                        const catStyle = getCategoryStyle(place.category as never)
                        const saveState = saveStates[idx] ?? 'idle'
                        const photoRef = photoRefs[idx]
                        const hasPhoto = photoRef !== undefined // undefined = 아직 로딩 중

                        return (
                          <div key={idx} className="py-4">
                            <div className="flex items-start gap-3">
                              {/* 썸네일 — 로딩 중엔 스켈레톤, 완료 후 사진 or 이모지 */}
                              {!hasPhoto ? (
                                <div className="mt-0.5 h-11 w-11 flex-shrink-0 animate-pulse rounded-xl bg-gray-100" />
                              ) : (
                                <PlacePhoto
                                  photoRef={photoRef}
                                  categoryStyle={catStyle}
                                  iconSize={18}
                                  className="mt-0.5 h-11 w-11 flex-shrink-0 rounded-xl"
                                />
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-ink truncate text-[15px] font-bold">
                                    {place.name}
                                  </p>
                                  <span
                                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                    style={{
                                      backgroundColor: catStyle.hex + '18',
                                      color: catStyle.hex,
                                    }}
                                  >
                                    {place.category}
                                  </span>
                                </div>
                                <p className="text-ink2 mt-1 text-[12px] leading-relaxed">
                                  {place.reason}
                                </p>
                                <p className="text-ink3 mt-1 text-[11px]">💡 {place.tip}</p>
                              </div>

                              <button
                                onClick={() => handleSave(idx)}
                                disabled={
                                  saveState === 'loading' ||
                                  saveState === 'saved' ||
                                  saveState === 'exists'
                                }
                                className="flex flex-shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all active:opacity-70"
                                style={
                                  saveState === 'saved' || saveState === 'exists'
                                    ? { backgroundColor: '#10b98118', color: '#10b981' }
                                    : saveState === 'error'
                                      ? { backgroundColor: '#ef444418', color: '#ef4444' }
                                      : { backgroundColor: '#0891b218', color: '#0891b2' }
                                }
                              >
                                {saveState === 'loading' ? (
                                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : saveState === 'saved' ? (
                                  <>✓ {isKo ? '저장됨' : 'Saved'}</>
                                ) : saveState === 'exists' ? (
                                  <>✓ {isKo ? '있음' : 'In list'}</>
                                ) : saveState === 'error' ? (
                                  isKo ? '실패' : 'Error'
                                ) : (
                                  isKo ? '저장' : 'Save'
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* 하단 버튼 — 에러 상태엔 콘텐츠 안에 이미 버튼 있음 */}
              {!loading && result && (
                <div className="border-border pb-safe flex-shrink-0 border-t px-4 py-3 flex gap-2">
                  <button
                    onClick={handleAskForTrip}
                    className="flex-1 rounded-2xl py-3 text-[14px] font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)' }}
                  >
                    {isKo ? '여행 일정 만들기 →' : 'Build itinerary →'}
                  </button>
                  <button
                    onClick={() => {
                      setResult(null)
                      setError(false)
                      fetchRecommend()
                    }}
                    className="border-border text-ink2 rounded-2xl border px-4 py-3 text-[14px] font-semibold"
                  >
                    {isKo ? '다시' : 'Refresh'}
                  </button>
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </>
  )
}

'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createTripReturnId, addItineraryItem, addMemoItem } from '@/app/actions/trip'
import { getOrCreatePlace } from '@/app/actions/backlog'
import type { GeneratedItinerary } from '@/app/api/ai/itinerary/route'

const STYLES = [
  { key: 'relaxed', label: '여유롭게' },
  { key: 'active', label: '알차게' },
  { key: 'food', label: '맛집 중심' },
  { key: 'culture', label: '문화·역사' },
  { key: 'nature', label: '자연·힐링' },
  { key: 'photo', label: '사진 스팟' },
]

const COMPANIONS = [
  { key: 'solo', label: '혼자' },
  { key: 'couple', label: '둘이서' },
  { key: 'family', label: '가족과' },
  { key: 'friends', label: '친구들과' },
]

interface Props {
  title: string
  destination: string
  startDate: string
  endDate: string
  coverUrl: string
  onClose: () => void
}

export default function AIItinerarySheet({ title, destination, startDate, endDate, coverUrl, onClose }: Props) {
  const locale = useLocale()
  const router = useRouter()

  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [companion, setCompanion] = useState('solo')
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null)
  const [parseError, setParseError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStep, setSaveStep] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const canGenerate = !!destination && !!startDate && !!endDate && !streaming

  const generate = useCallback(async () => {
    if (!canGenerate) return
    setStreamText('')
    setItinerary(null)
    setParseError(false)
    setStreaming(true)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, startDate, endDate, style: selectedStyles, companion, locale }),
        signal: abortRef.current.signal,
      })
      if (!res.ok || !res.body) throw new Error('failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setStreamText(accumulated)
      }

      try {
        const parsed = JSON.parse(accumulated) as GeneratedItinerary
        setItinerary(parsed)
      } catch {
        setParseError(true)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setParseError(true)
    } finally {
      setStreaming(false)
    }
  }, [canGenerate, destination, startDate, endDate, selectedStyles, companion, locale])

  async function applyItinerary() {
    if (!itinerary || saving) return
    setSaving(true)

    try {
      setSaveStep('여행 만드는 중...')
      const fd = new FormData()
      fd.set('title', title || itinerary.title)
      fd.set('destination', destination)
      fd.set('start_date', startDate)
      fd.set('end_date', endDate)
      fd.set('cover_url', coverUrl)
      const { id: tripId, error } = await createTripReturnId(fd)
      if (error || !tripId) throw new Error(error)

      for (const day of itinerary.days) {
        setSaveStep(`${day.day_number}일차 일정 저장 중...`)
        for (const item of day.items) {
          try {
            const searchRes = await fetch(
              `/api/places/search?q=${encodeURIComponent(item.google_search_query)}`,
            )
            const searchData = await searchRes.json()
            const found = searchData.places?.[0]

            if (found) {
              const placeId = await getOrCreatePlace({
                googlePlaceId: found.id,
                name: found.displayName.text,
                address: found.formattedAddress,
                categoryName: item.category,
                lat: found.location?.latitude ?? null,
                lng: found.location?.longitude ?? null,
              })
              if (placeId) {
                await addItineraryItem(tripId, day.day_date, day.day_number, placeId)
              }
            } else {
              const memo = [
                item.place_name,
                item.visit_time && `(${item.visit_time})`,
                item.memo,
              ].filter(Boolean).join(' ')
              await addMemoItem(tripId, day.day_date, day.day_number, memo)
            }
          } catch {
            // 개별 실패는 무시하고 계속
          }
        }
      }

      router.push(`/${locale}/trips/${tripId}`)
    } catch {
      setSaving(false)
      setSaveStep('')
    }
  }

  function toggleStyle(key: string) {
    setSelectedStyles((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/40" onClick={() => { if (!saving) onClose() }} />

      <div className="fixed inset-x-0 bottom-0 z-[81] flex max-h-[92dvh] flex-col rounded-t-3xl bg-white">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1 flex-shrink-0">
          <div>
            <p className="text-[18px] font-bold text-ink">✨ AI 일정 자동 생성</p>
            <p className="text-[12px] text-ink3">{destination} · {startDate} ~ {endDate}</p>
          </div>
          {!saving && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="#666" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="h-px bg-border flex-shrink-0" />

        <div className="flex-1 overflow-y-auto">
          {/* 옵션 선택 — 아직 생성 안 됐을 때만 */}
          {!itinerary && !streaming && (
            <div className="px-5 py-4 space-y-4">
              {/* 여행 스타일 */}
              <div>
                <p className="text-[13px] font-semibold text-ink mb-2">여행 스타일 (복수 선택)</p>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => toggleStyle(s.key)}
                      className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                        selectedStyles.includes(s.key)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-ink2'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 동행 */}
              <div>
                <p className="text-[13px] font-semibold text-ink mb-2">동행</p>
                <div className="flex gap-2">
                  {COMPANIONS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setCompanion(c.key)}
                      className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                        companion === c.key ? 'bg-primary text-white' : 'bg-gray-100 text-ink2'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 스트리밍 중 raw 텍스트 */}
          {streaming && !itinerary && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3 text-[13px] text-ink3">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                AI가 일정을 짜고 있어요...
              </div>
              <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-ink3 font-mono opacity-60">
                {streamText.slice(0, 400)}{streamText.length > 400 ? '...' : ''}
              </p>
            </div>
          )}

          {/* 파싱 오류 */}
          {parseError && (
            <div className="px-5 py-4 text-center text-[13px] text-ink3">
              일정 생성에 실패했어요. 다시 시도해주세요.
            </div>
          )}

          {/* 생성된 일정 미리보기 */}
          {itinerary && (
            <div className="px-5 py-4 space-y-3">
              <div className="rounded-2xl bg-primary/5 px-4 py-3">
                <p className="text-[13px] font-bold text-primary">{itinerary.title}</p>
                <p className="mt-1 text-[12px] text-ink3 leading-relaxed">{itinerary.summary}</p>
              </div>

              {itinerary.days.map((day) => (
                <div key={day.day_number} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white">
                      {day.day_number}일차
                    </span>
                    <span className="text-[12px] text-ink3">{day.day_date}</span>
                    <span className="text-[12px] font-medium text-ink">· {day.theme}</span>
                  </div>
                  <div className="space-y-2">
                    {day.items.map((item) => (
                      <div key={item.order_index} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex-shrink-0 text-[11px] font-semibold text-primary w-10">
                          {item.visit_time}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-ink">{item.place_name}</p>
                          {item.memo && (
                            <p className="text-[11px] text-ink3">{item.memo}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 저장 진행 */}
          {saving && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <p className="text-[14px] font-medium text-ink">{saveStep}</p>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {!saving && (
          <div className="flex-shrink-0 border-t border-border px-4 py-3 pb-safe">
            {!itinerary ? (
              <button
                onClick={generate}
                disabled={!canGenerate || streaming}
                className="w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
              >
                {streaming ? '일정 생성 중...' : 'AI 일정 생성하기'}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setItinerary(null); setStreamText('') }}
                  className="flex-1 rounded-2xl border border-border py-3.5 text-[14px] font-semibold text-ink2"
                >
                  다시 생성
                </button>
                <button
                  onClick={applyItinerary}
                  className="flex-[2] rounded-2xl bg-primary py-3.5 text-[14px] font-bold text-white"
                >
                  이 일정으로 여행 만들기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

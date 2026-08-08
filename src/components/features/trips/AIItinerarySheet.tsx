'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { applyGeneratedItinerary } from '@/app/actions/trip'
import PageLoading from '@/components/ui/PageLoading'
import type { GeneratedItinerary } from '@/app/api/ai/itinerary/route'

const STYLES = ['relaxed', 'active', 'food', 'culture', 'nature', 'photo']

const COMPANIONS = ['solo', 'couple', 'family', 'friends']

interface Props {
  title: string
  destination: string
  startDate: string
  endDate: string
  /** 'HH:MM'. 있으면 첫날/마지막날을 이 시각에 맞춰 짠다 */
  startTime?: string
  endTime?: string
  coverUrl: string
  /**
   * 이미 만들어진 여행에 일정을 채워 넣을 때 그 여행 id.
   * 없으면 새 여행을 만들면서 일정까지 함께 저장한다.
   */
  tripId?: string
  /**
   * 채울 날만 지정한다. 비우면 전체 기간을 짠다.
   * 날짜와 일차를 함께 넘긴다 — 날짜만 주면 모델이 1일차부터 새로 번호를
   * 붙여서 엉뚱한 날을 짜는 일이 있었다.
   */
  targetDays?: Array<{ dayNumber: number; dayDate: string }>
  /** 이미 여행에 담긴 장소명. 같은 곳을 또 추천하지 않게 한다 */
  excludePlaces?: string[]
  onClose: () => void
}

export default function AIItinerarySheet({
  title,
  destination,
  startDate,
  endDate,
  startTime = '',
  endTime = '',
  coverUrl,
  tripId: existingTripId,
  targetDays = [],
  excludePlaces = [],
  onClose,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('trips')
  const to = useTranslations('onboarding')
  const router = useRouter()

  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [companion, setCompanion] = useState('solo')
  const [notes, setNotes] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null)
  const [parseError, setParseError] = useState(false)
  const [saving, setSaving] = useState(false)
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
        body: JSON.stringify({
          destination,
          startDate,
          endDate,
          startTime,
          endTime,
          targetDays,
          excludePlaces,
          style: selectedStyles,
          companion,
          notes,
          locale,
        }),
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
  }, [
    canGenerate,
    destination,
    startDate,
    endDate,
    startTime,
    endTime,
    targetDays,
    excludePlaces,
    selectedStyles,
    companion,
    notes,
    locale,
  ])

  async function applyItinerary() {
    if (!itinerary || saving) return
    setSaving(true)

    try {
      // 모델이 day_number를 잘못 붙여도 날짜 기준으로 우리가 아는 일차를 쓴다
      const dayNumberByDate = new Map(targetDays.map((d) => [d.dayDate, d.dayNumber]))
      const days = itinerary.days
        // 대상 날짜를 지정했으면 그 날만 저장한다 (모델이 다른 날을 끼워도 방어)
        .filter((day) => dayNumberByDate.size === 0 || dayNumberByDate.has(day.day_date))
        .map((day) => ({
          dayNumber: dayNumberByDate.get(day.day_date) ?? day.day_number,
          dayDate: day.day_date,
          items: day.items.map((item) => ({
            placeName: item.place_name,
            category: item.category,
            visitTime: item.visit_time,
            memo: item.memo,
            googleSearchQuery: item.google_search_query,
          })),
        }))

      // 검색·장소 upsert·일정 등록을 서버에서 한 번에 처리한다.
      // 전에는 항목마다 검색 1번 + 서버 액션 2번을 순서대로 돌려서
      // 20~30개짜리 일정이면 왕복이 100번을 넘었다.
      const { tripId, error } = await applyGeneratedItinerary(
        existingTripId
          ? { tripId: existingTripId, days }
          : {
              newTrip: {
                title: title || itinerary.title,
                destination: destination || null,
                startDate: startDate || null,
                endDate: endDate || null,
                startTime: startTime || null,
                endTime: endTime || null,
                coverUrl: coverUrl || null,
              },
              days,
            },
      )
      if (error || !tripId) throw new Error(error)

      // 기존 여행에 채워 넣은 경우 목적지 URL이 지금 URL과 같아서
      // replace가 이 컴포넌트를 언마운트시키지 않는다. 그러면 saving이
      // true로 남아 로딩 오버레이가 안 사라지고, 새로고침해야만 결과가
      // 보이는 문제가 생긴다. 시트를 직접 닫아 목록 화면을 드러낸다.
      router.replace(`/${locale}/trips/${tripId}`)
      router.refresh()
      onClose()
    } catch {
      setSaving(false)
    }
  }

  function toggleStyle(key: string) {
    setSelectedStyles((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    )
  }

  return (
    <>
      {/* 등록 중엔 앱 전체에서 쓰는 제출 오버레이를 그대로 쓴다
          (로그인/회원가입과 같은 패턴) */}
      <PageLoading visible={saving} />

      <div
        className="fixed inset-0 z-[80] bg-black/40"
        onClick={() => {
          if (!saving) onClose()
        }}
      />

      <div className="fixed inset-x-0 bottom-0 z-[81] flex max-h-[92dvh] flex-col rounded-t-3xl bg-white">
        {/* 핸들 */}
        <div className="flex flex-shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* 헤더 */}
        <div className="flex flex-shrink-0 items-center justify-between px-5 pt-1 pb-3">
          <div>
            <p className="text-ink text-[18px] font-bold">{t('ai.title')}</p>
            <p className="text-ink3 text-[12px]">
              {destination} · {startDate} ~ {endDate}
            </p>
          </div>
          {!saving && (
            <button
              onClick={onClose}
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
          )}
        </div>

        <div className="bg-border h-px flex-shrink-0" />

        <div className="flex-1 overflow-y-auto">
          {/* 옵션 선택 — 아직 생성 안 됐을 때만 */}
          {!itinerary && !streaming && (
            <div className="space-y-4 px-5 py-4">
              {/* 여행 스타일 */}
              <div>
                <p className="text-ink mb-2 text-[13px] font-semibold">{t('ai.styleLabel')}</p>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((key) => (
                    <button
                      key={key}
                      onClick={() => toggleStyle(key)}
                      className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                        selectedStyles.includes(key)
                          ? 'bg-primary text-white'
                          : 'text-ink2 bg-gray-100'
                      }`}
                    >
                      {t(`ai.style.${key}` as never)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 동행 */}
              <div>
                <p className="text-ink mb-2 text-[13px] font-semibold">{t('ai.companionLabel')}</p>
                <div className="flex gap-2">
                  {COMPANIONS.map((key) => (
                    <button
                      key={key}
                      onClick={() => setCompanion(key)}
                      className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                        companion === key ? 'bg-primary text-white' : 'text-ink2 bg-gray-100'
                      }`}
                    >
                      {to(`companion.${key}` as never)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 추가 요청 — 칩으로 담기지 않는 구체적인 조건을 받는다 */}
              <div>
                <p className="text-ink mb-2 text-[13px] font-semibold">
                  {t('ai.notesLabel')}
                  <span className="text-ink3 ml-1 font-normal">{t('ai.optional')}</span>
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder={t('ai.notesPlaceholder')}
                  className="border-border bg-bg2 text-ink placeholder:text-ink3 focus:border-primary w-full resize-none rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed transition-colors outline-none"
                />
                {notes.length > 0 && (
                  <p className="text-ink3 mt-1 text-right text-[11px]">{notes.length}/500</p>
                )}
              </div>
            </div>
          )}

          {/* 스트리밍 중 raw 텍스트 */}
          {streaming && !itinerary && (
            <div className="px-5 py-4">
              <div className="text-ink3 mb-3 flex items-center gap-2 text-[13px]">
                <div className="border-primary h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent" />
                {t('ai.working')}
              </div>
              <p className="text-ink3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap opacity-60">
                {streamText.slice(0, 400)}
                {streamText.length > 400 ? '...' : ''}
              </p>
            </div>
          )}

          {/* 파싱 오류 */}
          {parseError && (
            <div className="text-ink3 px-5 py-4 text-center text-[13px]">{t('ai.failed')}</div>
          )}

          {/* 생성된 일정 미리보기 */}
          {itinerary && (
            <div className="space-y-3 px-5 py-4">
              <div className="bg-primary/5 rounded-2xl px-4 py-3">
                <p className="text-primary text-[13px] font-bold">{itinerary.title}</p>
                <p className="text-ink3 mt-1 text-[12px] leading-relaxed">{itinerary.summary}</p>
              </div>

              {itinerary.days.map((day) => (
                <div key={day.day_number} className="border-border rounded-2xl border p-4">
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="bg-primary rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white">
                      {t('ai.dayN', { n: day.day_number })}
                    </span>
                    <span className="text-ink3 text-[12px]">{day.day_date}</span>
                    <span className="text-ink text-[12px] font-medium">· {day.theme}</span>
                  </div>
                  <div className="space-y-2">
                    {day.items.map((item) => (
                      <div key={item.order_index} className="flex items-start gap-2.5">
                        <span className="text-primary mt-0.5 w-10 flex-shrink-0 text-[11px] font-semibold">
                          {item.visit_time}
                        </span>
                        <div className="min-w-0">
                          <p className="text-ink text-[13px] font-semibold">{item.place_name}</p>
                          {item.memo && <p className="text-ink3 text-[11px]">{item.memo}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {!saving && (
          <div className="border-border pb-safe flex-shrink-0 border-t px-4 py-3">
            {!itinerary ? (
              <button
                onClick={generate}
                disabled={!canGenerate || streaming}
                className="bg-primary w-full rounded-2xl py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
              >
                {streaming ? t('ai.generating') : t('ai.generate')}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setItinerary(null)
                    setStreamText('')
                  }}
                  className="border-border text-ink2 flex-1 rounded-2xl border py-3.5 text-[14px] font-semibold"
                >
                  {t('ai.regenerate')}
                </button>
                <button
                  onClick={applyItinerary}
                  className="bg-primary flex-[2] rounded-2xl py-3.5 text-[14px] font-bold text-white"
                >
                  {existingTripId ? t('ai.applyExisting') : t('ai.apply')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

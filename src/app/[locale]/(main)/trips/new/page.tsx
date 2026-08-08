'use client'

import { useState, useTransition, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import AppHeader from '@/components/common/AppHeader'
import Button from '@/components/ui/Button'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { createTrip } from '@/app/actions/trip'
import { uploadCoverImage, isGradient } from '@/utils/uploadCover'
import DestinationInput from '@/components/features/trips/DestinationInput'
import { createClient } from '@/lib/supabase/client'
import { COVER_PRESETS } from '@/utils/coverPresets'
import AIItinerarySheet from '@/components/features/trips/AIItinerarySheet'
import UpgradeSheet from '@/components/features/subscription/UpgradeSheet'

const INPUT_CLASS =
  'w-full rounded-2xl border border-border bg-bg2 px-4 py-3.5 text-[15px] text-ink placeholder:text-ink3 outline-none focus:border-primary focus:bg-white transition-colors'

interface DestSegment {
  destination: string
  startDate: string
  endDate: string
}

function formatDateRangeLabel(startDate: string, endDate: string, locale: string) {
  if (!startDate) return locale === 'ko' ? '날짜 선택' : 'Select dates'
  const [, sm, sd] = startDate.split('-').map(Number)
  const sDate = new Date(Number(startDate.split('-')[0]), sm - 1, sd)
  const wd = locale === 'ko'
    ? ['일', '월', '화', '수', '목', '금', '토'][sDate.getDay()]
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][sDate.getDay()]
  const sLabel = locale === 'ko' ? `${sm}/${sd}(${wd})` : `${sm}/${sd}`

  if (!endDate || startDate === endDate) return sLabel

  const [, em, ed] = endDate.split('-').map(Number)
  const eDate = new Date(Number(endDate.split('-')[0]), em - 1, ed)
  const ewd = locale === 'ko'
    ? ['일', '월', '화', '수', '목', '금', '토'][eDate.getDay()]
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][eDate.getDay()]
  const eLabel = locale === 'ko' ? `${em}/${ed}(${ewd})` : `${em}/${ed}`
  const nights = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
  const nightsLabel = locale === 'ko' ? `${nights}박 ${nights + 1}일` : `${nights}N ${nights + 1}D`
  return `${sLabel} → ${eLabel}  ·  ${nightsLabel}`
}

export default function NewTripPage() {
  const t = useTranslations('trips')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const [selectedCover, setSelectedCover] = useState(COVER_PRESETS[0])
  const [segments, setSegments] = useState<DestSegment[]>([
    { destination: '', startDate: '', endDate: '' },
  ])
  const [datePickerFor, setDatePickerFor] = useState<number | null>(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [title, setTitle] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [tripLimitSheet, setTripLimitSheet] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAISheet, setShowAISheet] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Derived overall trip dates
  const allStarts = segments.map((s) => s.startDate).filter(Boolean).sort()
  const allEnds = segments.map((s) => s.endDate).filter(Boolean).sort()
  const overallStart = allStarts[0] ?? ''
  const overallEnd = allEnds[allEnds.length - 1] ?? ''

  function updateSegment(i: number, patch: Partial<DestSegment>) {
    setSegments((prev) => {
      const next = prev.map((s, j) => (j === i ? { ...s, ...patch } : s))
      // endDate가 바뀌면 다음 세그먼트 startDate를 자동으로 맞춤
      if ('endDate' in patch && patch.endDate && i < prev.length - 1) {
        next[i + 1] = { ...next[i + 1], startDate: patch.endDate }
      }
      return next
    })
  }

  function addSegment() {
    setSegments((prev) => {
      const last = prev[prev.length - 1]
      return [...prev, { destination: '', startDate: last?.endDate ?? '', endDate: '' }]
    })
  }

  function removeSegment(i: number) {
    setSegments((prev) => prev.filter((_, j) => j !== i))
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setUploading(false)
      return
    }
    const { url, error } = await uploadCoverImage(file, user.id)
    if (url) setSelectedCover(url)
    else setErrorMsg(error ?? t('coverUploadFailed'))
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    const fd = new FormData(e.currentTarget)
    fd.set('cover_url', selectedCover)
    // Inject derived trip dates + destinations JSON
    fd.set('destination', segments[0]?.destination ?? '')
    fd.set('start_date', overallStart)
    fd.set('end_date', overallEnd)
    fd.set('destinations', JSON.stringify(segments))
    startTransition(async () => {
      const result = await createTrip(fd)
      if (result?.error === 'trip_limit_reached') {
        setTripLimitSheet(true)
      } else if (result?.error) {
        setErrorMsg(result.error)
      }
    })
  }

  return (
    <>
    {tripLimitSheet && (
      <UpgradeSheet
        required="pro"
        feature="여행 3개 초과 생성"
        onClose={() => setTripLimitSheet(false)}
      />
    )}
    <div className="flex min-h-full flex-col bg-white">
      <AppHeader title={t('newTitle')} onBack="router" />

      {/* 커버 미리보기 */}
      <div className="relative h-32 flex-shrink-0 overflow-hidden transition-all duration-500">
        {isGradient(selectedCover) ? (
          <div className="h-full w-full" style={{ background: selectedCover }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selectedCover} alt={t('cover')} className="h-full w-full object-cover" />
        )}
      </div>

      <form
        id="new-trip-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 px-4 py-5 pb-32"
      >
        {/* 커버 선택 */}
        <div>
          <p className="text-ink mb-3 text-[13px] font-semibold">{t('coverSelect')}</p>
          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="border-ink3 bg-bg2 relative flex h-10 items-center justify-center rounded-xl border-2 border-dashed disabled:opacity-50"
            >
              {uploading ? (
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 4v10M4 9h10" stroke="var(--color-ink3)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              {!isGradient(selectedCover) && (
                <span className="ring-primary absolute inset-0 rounded-xl ring-2 ring-offset-2" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              onChange={handleImageSelect}
            />
            {COVER_PRESETS.map((gradient) => (
              <button
                key={gradient}
                type="button"
                onClick={() => setSelectedCover(gradient)}
                className="relative h-10 rounded-xl"
                style={{ background: gradient }}
              >
                {selectedCover === gradient && (
                  <span className="ring-primary absolute inset-0 rounded-xl ring-2 ring-offset-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 여행 제목 */}
        <div>
          <label className="text-ink mb-2 block text-[13px] font-semibold">
            {t('tripName')} <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            maxLength={60}
            placeholder={t('titlePlaceholderNew')}
            className={INPUT_CLASS}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 목적지 & 기간 (세그먼트) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-ink text-[13px] font-semibold">
              {t('destination')} / {t('period')}
              <span className="text-ink3 ml-1 font-normal">{t('optional')}</span>
            </p>
          </div>

          {segments.map((seg, i) => (
            <div key={i} className="space-y-2">
              {/* 세그먼트 헤더 (2개 이상일 때) */}
              {segments.length > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-ink3 text-[12px] font-semibold">
                    {i === 0
                      ? (locale === 'ko' ? '첫 번째 목적지' : '1st destination')
                      : locale === 'ko'
                        ? `경유지 ${i}`
                        : `Stop ${i}`}
                  </p>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => removeSegment(i)}
                      className="text-ink3 text-[12px]"
                    >
                      {locale === 'ko' ? '삭제' : 'Remove'}
                    </button>
                  )}
                </div>
              )}

              {/* 목적지 */}
              <DestinationInput
                value={seg.destination}
                onChange={(d) => updateSegment(i, { destination: d })}
              />

              {/* 날짜 범위 */}
              <button
                type="button"
                onClick={() => setDatePickerFor(i)}
                className={`border-border bg-bg2 focus:border-primary flex w-full items-center gap-2.5 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                  seg.startDate ? 'border-primary/30 bg-primary/5' : ''
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={seg.startDate ? 'text-primary' : 'text-ink3'}
                >
                  <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M1.5 6.5h13M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span className={`text-[15px] ${seg.startDate ? 'text-ink font-medium' : 'text-ink3'}`}>
                  {formatDateRangeLabel(seg.startDate, seg.endDate, locale)}
                </span>
              </button>
            </div>
          ))}

          {/* 경유지 추가 */}
          <button
            type="button"
            onClick={addSegment}
            className="border-border text-ink3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed py-3 text-[13px]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {locale === 'ko' ? '경유지 추가' : 'Add stop'}
          </button>
        </div>

        {/* 시간 (선택) */}
        <div>
          <label className="text-ink mb-2 block text-[13px] font-semibold">
            {locale === 'ko' ? '출발·도착 시간' : 'Departure / Arrival time'}
            <span className="text-ink3 ml-1 font-normal">{t('optional')}</span>
          </label>
          <div className="border-border divide-border bg-bg2 divide-y overflow-hidden rounded-2xl border">
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="text-ink3 w-9 flex-shrink-0 text-[12px] font-semibold">
                {t('rangeStart')}
              </span>
              <input
                name="start_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-ink min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="text-ink3 w-9 flex-shrink-0 text-[12px] font-semibold">
                {t('rangeEnd')}
              </span>
              <input
                name="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-ink min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
            </div>
          </div>
        </div>

        {/* AI 일정 생성 */}
        {(() => {
          const ready = !!segments[0]?.destination && !!overallStart && !!overallEnd
          return (
            <button
              type="button"
              onClick={() => ready && setShowAISheet(true)}
              disabled={!ready}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                ready
                  ? 'border-primary/30 bg-primary/5 active:bg-primary/10'
                  : 'border-border bg-bg2'
              }`}
            >
              <span className={`text-[22px] ${ready ? '' : 'opacity-40'}`}>✨</span>
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] font-bold ${ready ? 'text-primary' : 'text-ink3'}`}>
                  {t('aiCardTitle')}
                </p>
                <p className="text-ink3 text-[12px]">
                  {ready
                    ? t('aiCardReady', { destination: segments[0].destination })
                    : t('aiCardNotReady')}
                </p>
              </div>
              {ready && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-primary/50 flex-shrink-0">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          )
        })()}

        {errorMsg && <p className="text-center text-[13px] text-red-500">{errorMsg}</p>}
      </form>

      {/* 날짜 레인지 피커 */}
      {datePickerFor !== null && (
        <DateRangePicker
          startDate={segments[datePickerFor]?.startDate ?? ''}
          endDate={segments[datePickerFor]?.endDate ?? ''}
          minDate={datePickerFor > 0 ? segments[datePickerFor - 1]?.endDate || '' : ''}
          onChange={(start, end) => {
            const idx = datePickerFor
            updateSegment(idx, { startDate: start, endDate: end })
          }}
          onClose={() => setDatePickerFor(null)}
        />
      )}

      {showAISheet && (
        <AIItinerarySheet
          title={title}
          destination={segments[0]?.destination ?? ''}
          startDate={overallStart}
          endDate={overallEnd}
          startTime={startTime}
          endTime={endTime}
          coverUrl={selectedCover}
          segments={segments}
          onClose={() => setShowAISheet(false)}
        />
      )}

      {/* 하단 고정 버튼 */}
      <div className="border-border fixed right-0 bottom-0 left-0 border-t bg-white px-4 pt-3 pb-8">
        <Button form="new-trip-form" type="submit" disabled={isPending} fullWidth>
          {isPending ? t('creating') : t('create')}
        </Button>
      </div>
    </div>
    </>
  )
}

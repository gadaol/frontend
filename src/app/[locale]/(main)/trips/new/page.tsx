'use client'

import { useState, useTransition, useRef } from 'react'
import { useTranslations } from 'next-intl'
import AppHeader from '@/components/common/AppHeader'
import Button from '@/components/ui/Button'
import { createTrip } from '@/app/actions/trip'
import { uploadCoverImage, isGradient } from '@/utils/uploadCover'
import DestinationInput from '@/components/features/trips/DestinationInput'
import { createClient } from '@/lib/supabase/client'
import { COVER_PRESETS } from '@/utils/coverPresets'
import AIItinerarySheet from '@/components/features/trips/AIItinerarySheet'

const INPUT_CLASS =
  'w-full rounded-2xl border border-border bg-bg2 px-4 py-3.5 text-[15px] text-ink placeholder:text-ink3 outline-none focus:border-primary focus:bg-white transition-colors'

export default function NewTripPage() {
  const t = useTranslations('trips')
  const [isPending, startTransition] = useTransition()
  const [selectedCover, setSelectedCover] = useState(COVER_PRESETS[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [destination, setDestination] = useState('')
  const [title, setTitle] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showAISheet, setShowAISheet] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    startTransition(async () => {
      const result = await createTrip(fd)
      if (result?.error) setErrorMsg(result.error)
    })
  }

  return (
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
            {/* 이미지 업로드 버튼 */}
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
                  <path
                    d="M9 4v10M4 9h10"
                    stroke="var(--color-ink3)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
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

        {/* 목적지 */}
        <div>
          <label className="text-ink mb-2 block text-[13px] font-semibold">
            {t('destination')} <span className="text-ink3 font-normal">{t('optional')}</span>
          </label>
          <DestinationInput name="destination" value={destination} onChange={setDestination} />
        </div>

        {/* 기간 — 날짜와 시간을 한 블록에서 같이 잡는다 */}
        <div>
          <label className="text-ink mb-2 block text-[13px] font-semibold">
            {t('period')} <span className="text-ink3 font-normal">{t('optional')}</span>
          </label>

          <div className="border-border divide-border bg-bg2 divide-y overflow-hidden rounded-2xl border">
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="text-ink3 w-9 flex-shrink-0 text-[12px] font-semibold">
                {t('rangeStart')}
              </span>
              <input
                name="start_date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (endDate && e.target.value > endDate) setEndDate('')
                }}
                className="text-ink min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
              <input
                /* 폭을 고정하지 않는다 — iOS는 '오후 3:30', 크롬은 '15:30'으로
                       렌더돼 필요한 폭이 달라서 고정하면 잘린다 */
                name="start_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-ink2 flex-shrink-0 bg-transparent text-right text-[15px] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 px-4 py-3">
              <span className="text-ink3 w-9 flex-shrink-0 text-[12px] font-semibold">
                {t('rangeEnd')}
              </span>
              <input
                name="end_date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-ink min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
              <input
                name="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-ink2 flex-shrink-0 bg-transparent text-right text-[15px] outline-none"
              />
            </div>
          </div>
          <p className="text-ink3 mt-1.5 text-[12px]">{t('rangeHint')}</p>
        </div>

        {/* AI 일정 생성 — 조건이 맞을 때만 튀어나오면 못 찾으므로 항상 두고 안내한다 */}
        {(() => {
          const ready = !!destination && !!startDate && !!endDate
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
                  {ready ? t('aiCardReady', { destination }) : t('aiCardNotReady')}
                </p>
              </div>
              {ready && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-primary/50 flex-shrink-0"
                >
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          )
        })()}

        {errorMsg && <p className="text-center text-[13px] text-red-500">{errorMsg}</p>}
      </form>

      {showAISheet && (
        <AIItinerarySheet
          title={title}
          destination={destination}
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          coverUrl={selectedCover}
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
  )
}

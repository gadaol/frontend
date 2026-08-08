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

        {/* 날짜 */}
        <div>
          <label className="text-ink mb-2 block text-[13px] font-semibold">
            {t('period')} <span className="text-ink3 font-normal">{t('optional')}</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              name="start_date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (endDate && e.target.value > endDate) setEndDate('')
              }}
              className="border-border text-ink focus:border-primary bg-bg2 flex-1 rounded-2xl border px-4 py-3.5 text-[15px] transition-colors outline-none focus:bg-white"
            />
            <span className="text-ink3 text-[13px]">~</span>
            <input
              name="end_date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-border text-ink focus:border-primary bg-bg2 flex-1 rounded-2xl border px-4 py-3.5 text-[15px] transition-colors outline-none focus:bg-white"
            />
          </div>
          <p className="text-ink3 mt-1.5 text-[12px]">{t('dateLaterHint')}</p>
        </div>

        {/* AI 일정 자동 생성 버튼 */}
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

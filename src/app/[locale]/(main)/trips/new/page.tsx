'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import AppHeader from '@/components/common/AppHeader'
import { createTrip } from '@/app/actions/trip'

export default function NewTripPage() {
  const t = useTranslations('trips')
  const [isPending, startTransition] = useTransition()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => createTrip(formData))
  }

  return (
    <div className="bg-bg2 flex min-h-full flex-col">
      <AppHeader title={t('newTitle')} onBack="router" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-6">
        {/* 제목 */}
        <div className="flex flex-col gap-2">
          <label className="text-ink2 text-[13px] font-medium">{t('fieldTitle')}</label>
          <input
            name="title"
            type="text"
            required
            maxLength={60}
            placeholder={t('fieldTitlePlaceholder')}
            className="border-border bg-bg text-ink placeholder:text-ink3 focus:border-primary rounded-2xl border px-4 py-3.5 text-[15px] outline-none"
          />
        </div>

        {/* 날짜 */}
        <div className="flex flex-col gap-2">
          <label className="text-ink2 text-[13px] font-medium">{t('fieldDate')}</label>
          <div className="flex items-center gap-2">
            <input
              name="start_date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (endDate && e.target.value > endDate) setEndDate('')
              }}
              className="border-border bg-bg text-ink focus:border-primary flex-1 rounded-2xl border px-4 py-3.5 text-[15px] outline-none"
            />
            <span className="text-ink3 text-[13px]">~</span>
            <input
              name="end_date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-border bg-bg text-ink focus:border-primary flex-1 rounded-2xl border px-4 py-3.5 text-[15px] outline-none"
            />
          </div>
          <p className="text-ink3 text-[12px]">{t('fieldDateHint')}</p>
        </div>

        <div className="mt-auto pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary w-full rounded-2xl py-4 text-[16px] font-bold text-white disabled:opacity-60"
          >
            {isPending ? t('creating') : t('create')}
          </button>
        </div>
      </form>
    </div>
  )
}

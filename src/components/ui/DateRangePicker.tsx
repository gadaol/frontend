'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'

interface Props {
  startDate: string // YYYY-MM-DD or ''
  endDate: string // YYYY-MM-DD or ''
  onChange: (start: string, end: string) => void
  onClose: () => void
  /** 이 날짜 이전은 선택 불가 (경유지 연동) */
  minDate?: string
}

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']
const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayNum(ymd: string) {
  const [, , d] = ymd.split('-')
  return parseInt(d)
}

function nightsCount(s: string, e: string) {
  if (!s || !e) return 0
  return Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000)
}

function formatDisplay(ymd: string, locale: string) {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const wd = locale === 'ko' ? WEEKDAYS_KO[date.getDay()] : WEEKDAYS_EN[date.getDay()]
  if (locale === 'ko') return `${m}월 ${d}일 (${wd})`
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[m - 1]} ${d} (${wd})`
}

export default function DateRangePicker({ startDate, endDate, onChange, onClose, minDate }: Props) {
  const locale = useLocale()
  const today = toYMD(new Date())

  const [localStart, setLocalStart] = useState(startDate)
  const [localEnd, setLocalEnd] = useState(endDate)
  const [picking, setPicking] = useState<'start' | 'end'>(startDate ? 'end' : 'start')

  const initDate = localStart ? new Date(localStart + 'T12:00:00') : new Date()
  const [year, setYear] = useState(initDate.getFullYear())
  const [month, setMonth] = useState(initDate.getMonth() + 1)

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else setMonth((m) => m + 1)
  }

  function tapDay(ymd: string) {
    if (effectiveMin && ymd < effectiveMin) return
    if (picking === 'start' || !localStart) {
      setLocalStart(ymd)
      setLocalEnd('')
      setPicking('end')
    } else {
      if (ymd < localStart) {
        setLocalStart(ymd)
        setLocalEnd('')
      } else {
        setLocalEnd(ymd)
        setPicking('start')
        onChange(localStart, ymd)
      }
    }
  }

  function confirm() {
    const end = localEnd || localStart
    onChange(localStart, end)
    onClose()
  }

  // minDate가 있으면 그 이전 날은 비활성화, initDate도 minDate 이후로 조정
  const effectiveMin = minDate || ''

  // Build calendar cells
  const firstDow = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (string | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const nights = nightsCount(localStart, localEnd)
  const effectiveEnd = localEnd || localStart

  return (
    <>
      <div className="fixed inset-0 z-[85] bg-black/40" onClick={onClose} />
      <div
        className="fixed inset-x-0 bottom-0 z-[86] flex flex-col rounded-t-3xl bg-white"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* Range display */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            onClick={() => setPicking('start')}
            className={`flex-1 rounded-2xl border p-3 text-left transition-colors ${
              picking === 'start' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <p className="text-ink3 mb-0.5 text-[10px] font-semibold">
              {locale === 'ko' ? '출발일' : 'Start'}
            </p>
            <p className={`text-[13px] font-bold ${localStart ? 'text-ink' : 'text-ink3'}`}>
              {localStart ? formatDisplay(localStart, locale) : (locale === 'ko' ? '날짜 선택' : 'Select date')}
            </p>
          </button>

          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-ink3 flex-shrink-0"
          >
            <path
              d="M2 7h10M8 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <button
            onClick={() => localStart && setPicking('end')}
            className={`flex-1 rounded-2xl border p-3 text-left transition-colors ${
              picking === 'end' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <p className="text-ink3 mb-0.5 text-[10px] font-semibold">
              {locale === 'ko' ? '도착일' : 'End'}
            </p>
            <p className={`text-[13px] font-bold ${localEnd ? 'text-ink' : 'text-ink3'}`}>
              {localEnd ? formatDisplay(localEnd, locale) : (locale === 'ko' ? '날짜 선택' : 'Select date')}
            </p>
          </button>

          {nights > 0 && (
            <span className="text-primary flex-shrink-0 text-[12px] font-bold whitespace-nowrap">
              {locale === 'ko' ? `${nights}박 ${nights + 1}일` : `${nights}N`}
            </span>
          )}
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 py-1">
          <button onClick={prevMonth} className="-ml-2 p-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8l4-4"
                stroke="var(--color-ink)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <p className="text-ink text-[14px] font-bold">
            {locale === 'ko'
              ? `${year}년 ${month}월`
              : new Date(year, month - 1).toLocaleString('en', {
                  month: 'long',
                  year: 'numeric',
                })}
          </p>
          <button onClick={nextMonth} className="-mr-2 p-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 4l4 4-4 4"
                stroke="var(--color-ink)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 px-2">
          {(locale === 'ko' ? WEEKDAYS_KO : WEEKDAYS_EN).map((d, i) => (
            <div
              key={i}
              className={`py-1 text-center text-[11px] font-semibold ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-ink3'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-2 pb-2">
          {cells.map((ymd, i) => {
            if (!ymd) return <div key={i} className="h-10" />

            const isStart = ymd === localStart
            const isEnd = ymd === effectiveEnd && !!localEnd
            const isInRange = !!(localStart && localEnd && ymd > localStart && ymd < localEnd)
            const isToday = ymd === today
            const isSingleDay = localStart === localEnd
            const col = i % 7
            const isDisabled = !!(effectiveMin && ymd < effectiveMin)

            return (
              <button
                key={ymd}
                onClick={() => tapDay(ymd)}
                disabled={isDisabled}
                className="relative flex h-10 items-center justify-center disabled:cursor-not-allowed"
              >
                {/* Range background strips */}
                {isInRange && (
                  <span className="absolute inset-y-1 inset-x-0 bg-primary/10" />
                )}
                {isStart && localEnd && !isSingleDay && (
                  <span className="absolute inset-y-1 left-1/2 right-0 bg-primary/10" />
                )}
                {isEnd && localStart && !isSingleDay && (
                  <span className="absolute inset-y-1 left-0 right-1/2 bg-primary/10" />
                )}

                {/* Day circle */}
                <span
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium ${
                    isDisabled
                      ? 'text-ink3/30'
                      : isStart || isEnd
                        ? 'bg-primary font-bold text-white'
                        : isInRange
                          ? 'text-primary'
                          : isToday
                            ? 'font-bold text-primary'
                            : col === 0
                              ? 'text-red-400'
                              : col === 6
                                ? 'text-blue-400'
                                : 'text-ink'
                  }`}
                >
                  {dayNum(ymd)}
                </span>

                {/* Today dot */}
                {isToday && !isStart && !isEnd && (
                  <span className="bg-primary absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Confirm button */}
        <div className="px-4 pt-1 pb-4">
          <button
            onClick={confirm}
            disabled={!localStart}
            className="bg-primary w-full rounded-2xl py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
          >
            {locale === 'ko' ? '확인' : 'Confirm'}
          </button>
        </div>
      </div>
    </>
  )
}

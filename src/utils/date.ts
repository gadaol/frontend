import dayjs from 'dayjs'
import 'dayjs/locale/ko'

const KO_DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const
const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export function formatDateRange(start: string | null, end: string | null, locale = 'ko'): string {
  if (!start) return ''
  const days = locale === 'ko' ? KO_DAYS : EN_DAYS
  const fmt = (s: string) => {
    const d = dayjs(s)
    return `${d.month() + 1}.${String(d.date()).padStart(2, '0')}(${days[d.day()]})`
  }
  return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start)
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = dayjs(dateStr)
  return `${d.month() + 1}/${d.date()}`
}

export function today(): string {
  return dayjs().format('YYYY-MM-DD')
}

export function isTripOngoing(start: string | null, end: string | null): boolean {
  if (!start) return false
  const t = today()
  return start <= t && (end === null || end >= t)
}

export function isTripUpcoming(start: string | null): boolean {
  if (!start) return false
  return start > today()
}

export function tripDuration(start: string | null, end: string | null): number {
  if (!start || !end) return 1
  return Math.max(1, dayjs(end).diff(dayjs(start), 'day') + 1)
}

export function daysUntil(start: string | null): number {
  if (!start) return 0
  const diff = dayjs(start).diff(dayjs().startOf('day'), 'day')
  return Math.max(0, diff)
}

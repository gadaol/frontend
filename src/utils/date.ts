import dayjs from '@/lib/dayjs'

export function formatDateRange(start: string | null, end: string | null, locale = 'ko'): string {
  if (!start) return ''
  const fmt = (s: string) => dayjs(s).locale(locale).format('M.DD(ddd)')
  return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start)
}

export function formatDateShort(dateStr: string | null, locale = 'ko'): string {
  if (!dateStr) return ''
  return dayjs(dateStr).locale(locale).format('M/D')
}

export function formatDateFull(dateStr: string | null, locale = 'ko'): string {
  if (!dateStr) return ''
  return dayjs(dateStr).locale(locale).format('YYYY.MM.DD(ddd)')
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
  return Math.max(0, dayjs(start).diff(dayjs().startOf('day'), 'day'))
}

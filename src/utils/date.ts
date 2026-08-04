const KO_DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const
const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function parseDate(dateStr: string): Date {
  // "YYYY-MM-DD" → local midnight (avoid UTC offset shift)
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateRange(start: string | null, end: string | null, locale = 'ko'): string {
  if (!start) return ''
  const fmt = (s: string) => {
    const d = parseDate(s)
    const days = locale === 'ko' ? KO_DAYS : EN_DAYS
    return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}(${days[d.getDay()]})`
  }
  return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start)
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = parseDate(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  const s = parseDate(start)
  const e = parseDate(end)
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1)
}

import Link from 'next/link'
import { cn } from '@/utils/cn'
import { formatDateRange, isTripOngoing, tripDuration } from '@/utils/date'
import { isGradient } from '@/utils/uploadCover'
import type { TripWithMembers } from '@/types/trip'

const GRADIENTS = [
  'from-[#1B6FF0] to-[#0D3E8A]',
  'from-[#7C3AED] to-[#4C1D95]',
  'from-[#059669] to-[#064E3B]',
  'from-[#DC2626] to-[#7F1D1D]',
  'from-[#D97706] to-[#78350F]',
  'from-[#0891B2] to-[#164E63]',
] as const

function gradientForTitle(title: string) {
  const code = title.charCodeAt(0) || 0
  return GRADIENTS[code % GRADIENTS.length]
}

interface Props {
  trip: TripWithMembers
  locale: string
  variant?: 'horizontal' | 'vertical'
}

export default function TripCard({ trip, locale, variant = 'vertical' }: Props) {
  const ongoing = isTripOngoing(trip.start_date, trip.end_date)
  const nights =
    trip.start_date && trip.end_date ? tripDuration(trip.start_date, trip.end_date) - 1 : null

  if (variant === 'horizontal') {
    return (
      <Link
        href={`/${locale}/trips/${trip.id}`}
        className="border-border bg-bg flex items-center gap-3 rounded-2xl border p-4"
      >
        <CoverThumb title={trip.title} coverUrl={trip.cover_url} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="text-ink mb-0.5 truncate text-[15px] font-semibold">{trip.title}</div>
          <div className="text-ink3 text-[12px]">
            {formatDateRange(trip.start_date, trip.end_date, locale)}
          </div>
          {nights !== null && (
            <div className="text-ink3 mt-1 text-[12px]">
              {nights}박 {nights + 1}일
            </div>
          )}
        </div>
        <MemberAvatars count={trip.trip_members.length} />
      </Link>
    )
  }

  return (
    <Link
      href={`/${locale}/trips/${trip.id}`}
      className="border-border bg-bg block w-[200px] flex-shrink-0 overflow-hidden rounded-2xl border shadow-sm"
    >
      <CoverThumb title={trip.title} coverUrl={trip.cover_url} size="lg" ongoing={ongoing} />
      <div className="p-3">
        <div className="text-ink mb-1 truncate text-[14px] font-semibold">{trip.title}</div>
        <div className="text-ink3 text-[11px]">
          {formatDateRange(trip.start_date, trip.end_date, locale)}
        </div>
        <div className="mt-2 flex items-center justify-between">
          {nights !== null && (
            <span className="text-ink3 text-[11px]">
              {nights}박 {nights + 1}일
            </span>
          )}
          <MemberAvatars count={trip.trip_members.length} />
        </div>
      </div>
    </Link>
  )
}

function CoverThumb({
  title,
  coverUrl,
  size,
  ongoing,
}: {
  title: string
  coverUrl: string | null
  size: 'sm' | 'lg'
  ongoing?: boolean
}) {
  const sizeClass = size === 'lg' ? 'h-[110px]' : 'h-12 w-12 flex-shrink-0 rounded-xl'
  const gradient = gradientForTitle(title)

  return (
    <div className={cn('relative overflow-hidden', size === 'lg' ? 'w-full' : '', sizeClass)}>
      {coverUrl && isGradient(coverUrl) ? (
        <div
          className={cn('h-full w-full', size === 'sm' ? 'rounded-xl' : '')}
          style={{ background: coverUrl }}
        />
      ) : coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center bg-gradient-to-br',
            gradient,
            size === 'sm' ? 'rounded-xl' : '',
          )}
        >
          <span className="text-[20px] font-bold text-white/80">{title[0]}</span>
        </div>
      )}
      {ongoing && (
        <div className="bg-primary absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">
          진행 중
        </div>
      )}
    </div>
  )
}

function MemberAvatars({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-0.5">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-ink3">
        <circle cx="6.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M2 11c0-2.21 2.015-4 4.5-4s4.5 1.79 4.5 4"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-ink3 text-[11px]">{count}</span>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import {
  formatDateRange,
  isTripOngoing,
  isTripUpcoming,
  daysUntil,
  tripDuration,
} from '@/utils/date'
import { isGradient } from '@/utils/uploadCover'
import type { TripWithMembers } from '@/types/trip'

type Tab = 'upcoming' | 'ongoing' | 'done'

const AVATAR_COLORS = ['#1B6FF0', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2']

interface Props {
  trips: TripWithMembers[]
  profileMap: Map<string, string>
}

function TripCard({
  trip,
  locale,
  profileMap,
}: {
  trip: TripWithMembers
  locale: string
  profileMap: Map<string, string>
}) {
  const t = useTranslations('trips')
  const ongoing = isTripOngoing(trip.start_date, trip.end_date)
  const upcoming = isTripUpcoming(trip.start_date)
  const days = upcoming ? daysUntil(trip.start_date) : null
  const nights =
    trip.start_date && trip.end_date ? tripDuration(trip.start_date, trip.end_date) - 1 : null
  const memberCount = trip.trip_members.length

  return (
    <Link
      href={`/${locale}/trips/${trip.id}`}
      className="border-border bg-bg block overflow-hidden rounded-3xl border"
    >
      {/* 커버 */}
      <div className="relative h-32 w-full overflow-hidden">
        {trip.cover_url ? (
          isGradient(trip.cover_url) ? (
            <div className="h-full w-full" style={{ background: trip.cover_url }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={trip.cover_url} alt={trip.title} className="h-full w-full object-cover" />
          )
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, transparent), color-mix(in srgb, var(--color-hero-bot) 20%, transparent))',
            }}
          />
        )}

        {/* 상태 배지 (커버 위) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {ongoing && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-[3px] text-[11px] font-semibold text-white backdrop-blur-sm">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              {t('badgeOngoing')}
            </span>
          )}
          {upcoming && days !== null && (
            <span className="rounded-full bg-black/40 px-2.5 py-[3px] text-[11px] font-semibold text-white backdrop-blur-sm">
              D-{days}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-3.5">
        <p className="text-ink mb-1 text-[17px] font-bold">{trip.title}</p>

        {(trip.start_date || trip.end_date) && (
          <p className="text-ink2 text-[13px]">
            {formatDateRange(trip.start_date, trip.end_date, locale)}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          {/* 멤버 아바타 + 명수 */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {trip.trip_members.slice(0, 4).map((m, i) => {
                const initial = profileMap.get(m.user_id)?.[0] ?? '?'
                return (
                  <div
                    key={m.user_id}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white"
                    style={{
                      backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                      marginLeft: i > 0 ? -8 : 0,
                    }}
                  >
                    {initial}
                  </div>
                )
              })}
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-ink3 flex-shrink-0"
            >
              <circle cx="5" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M1 12c0-2.21 1.79-4 4-4s4 1.79 4 4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <circle cx="10" cy="4.5" r="1.4" stroke="currentColor" strokeWidth="1.1" />
              <path
                d="M12.5 12c0-1.657-1.12-3-2.5-3"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-ink3 text-[12px]">{memberCount}명</span>
          </div>

          {/* 기간 */}
          {nights !== null && (
            <span className="text-ink3 text-[12px]">
              {nights === 0 ? '당일치기' : `${nights}박 ${nights + 1}일`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function TripTabs({ trips, profileMap }: Props) {
  const t = useTranslations('trips')
  const locale = useLocale()
  const [tab, setTab] = useState<Tab>('upcoming')

  const upcoming = trips.filter(
    (trip) => isTripUpcoming(trip.start_date) && !isTripOngoing(trip.start_date, trip.end_date),
  )
  const ongoing = trips.filter((trip) => isTripOngoing(trip.start_date, trip.end_date))
  const done = trips.filter(
    (trip) => !isTripUpcoming(trip.start_date) && !isTripOngoing(trip.start_date, trip.end_date),
  )

  const tabMap: Record<Tab, TripWithMembers[]> = { upcoming, ongoing, done }
  const current = tabMap[tab]

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'upcoming', label: t('tabUpcoming'), count: upcoming.length },
    { key: 'ongoing', label: t('tabOngoing'), count: ongoing.length },
    { key: 'done', label: t('tabDone'), count: done.length },
  ]

  return (
    <div className="flex flex-col">
      {/* 탭 바 */}
      <div className="border-border border-b px-4">
        <div className="flex gap-0">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex-1 py-3.5 text-[14px] font-semibold transition-colors ${
                tab === key ? 'text-primary' : 'text-ink3'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`ml-1 text-[11px] ${tab === key ? 'text-primary' : 'text-ink3'}`}>
                  {count}
                </span>
              )}
              {tab === key && (
                <span className="bg-primary absolute right-0 bottom-0 left-0 h-[2px] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 여행 목록 */}
      <div className="flex flex-col gap-3 px-4 py-4">
        {current.length === 0 ? (
          <div className="border-border bg-bg flex flex-col items-center gap-2 rounded-3xl border py-10">
            <p className="text-ink3 text-[14px]">{t(`empty_${tab}`)}</p>
          </div>
        ) : (
          current.map((trip) => (
            <TripCard key={trip.id} trip={trip} locale={locale} profileMap={profileMap} />
          ))
        )}
      </div>
    </div>
  )
}

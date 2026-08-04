'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { formatDateRange, isTripOngoing, isTripUpcoming, daysUntil } from '@/utils/date'
import type { TripWithMembers } from '@/types/trip'

type Tab = 'upcoming' | 'ongoing' | 'done'

interface Props {
  trips: TripWithMembers[]
}

const AVATAR_COLORS = ['#1B6FF0', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2']

function TripCard({ trip, locale }: { trip: TripWithMembers; locale: string }) {
  const t = useTranslations('trips')
  const ongoing = isTripOngoing(trip.start_date, trip.end_date)
  const upcoming = isTripUpcoming(trip.start_date)
  const days = upcoming ? daysUntil(trip.start_date) : null

  return (
    <Link
      href={`/${locale}/trips/${trip.id}`}
      className="border-border bg-bg block overflow-hidden rounded-3xl border"
    >
      {/* 커버 영역 */}
      {trip.cover_url ? (
        <div
          className="h-32 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${trip.cover_url})` }}
        />
      ) : (
        <div
          className="h-32 w-full"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, transparent), color-mix(in srgb, var(--color-hero-bot) 20%, transparent))',
          }}
        />
      )}

      <div className="px-4 py-4">
        {/* 상태 배지 */}
        <div className="mb-2 flex items-center gap-2">
          {ongoing && (
            <span className="bg-primary-light text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold">
              <span className="bg-primary inline-block h-1.5 w-1.5 animate-pulse rounded-full" />
              {t('badgeOngoing')}
            </span>
          )}
          {upcoming && days !== null && (
            <span className="bg-primary inline-flex rounded-full px-2.5 py-[3px] text-[11px] font-semibold text-white">
              D-{days}
            </span>
          )}
        </div>

        <p className="text-ink mb-1 text-[17px] font-bold">{trip.title}</p>

        {(trip.start_date || trip.end_date) && (
          <p className="text-ink2 mb-3 text-[13px]">
            {formatDateRange(trip.start_date, trip.end_date, locale)}
          </p>
        )}

        <div className="flex items-center justify-between">
          {/* 멤버 아바타 */}
          <div className="flex">
            {trip.trip_members.slice(0, 4).map((m, i) => (
              <div
                key={m.user_id}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white"
                style={{
                  backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  marginLeft: i > 0 ? -8 : 0,
                }}
              >
                {String(i + 1)}
              </div>
            ))}
          </div>

          {trip.trip_tags.length > 0 && (
            <div className="flex gap-1">
              {trip.trip_tags.slice(0, 2).map((tg) => (
                <span
                  key={tg.tag}
                  className="bg-bg2 text-ink3 rounded-full px-2 py-0.5 text-[11px]"
                >
                  #{tg.tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function TripTabs({ trips }: Props) {
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
          current.map((trip) => <TripCard key={trip.id} trip={trip} locale={locale} />)
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { daysUntil, formatDateRange, isTripOngoing, isTripUpcoming } from '@/utils/date'
import type { BacklogItemWithPlace, TripWithMembers } from '@/types/trip'

const AVATAR_COLORS = ['#1B6FF0', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2']

function avatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length]
}

export default async function HomePage() {
  const supabase = await createClient()
  const locale = await getLocale()
  const t = await getTranslations('home')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const [tripsResult, backlogResult, notifResult, profileResult] = await Promise.all([
    supabase
      .from('trips')
      .select('*, trip_members(user_id, role), trip_tags(tag)')
      .order('start_date', { ascending: true }),
    supabase
      .from('backlog_items')
      .select('*, places(name, address)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
    supabase.from('profiles').select('name').eq('id', user.id).single(),
  ])

  const allTrips = (tripsResult.data ?? []) as TripWithMembers[]
  const backlogItems = (backlogResult.data ?? []) as BacklogItemWithPlace[]
  const unreadCount = notifResult.count ?? 0
  const displayName = profileResult.data?.name ?? ''

  const upcomingTrip =
    allTrips.find((trip) => isTripUpcoming(trip.start_date)) ??
    allTrips.find((trip) => isTripOngoing(trip.start_date, trip.end_date)) ??
    null

  return (
    <div className="min-h-full bg-[#F5F7FA]">
      {/* 다크 히어로 헤더 */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-7"
        style={{ background: 'linear-gradient(170deg, #070E1A 0%, #0F2351 100%)' }}
      >
        <div
          className="absolute right-0 bottom-0 left-0 h-7 bg-[#F5F7FA]"
          style={{ borderRadius: '28px 28px 0 0' }}
        />
        <p className="mb-1 text-[13px] text-white/50">{t('greetingSub')}</p>
        <p className="text-[22px] font-bold tracking-tight text-white">
          {displayName ? t('greeting', { name: displayName }) : t('greetingDefault')}
        </p>
        <Link
          href={`/${locale}/notifications`}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 1.5a4.5 4.5 0 0 1 4.5 4.5v3l1.5 2.25H3L4.5 9V6A4.5 4.5 0 0 1 9 1.5z"
              stroke="white"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M7.5 15a1.5 1.5 0 0 0 3 0" stroke="white" strokeWidth="1.4" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F04438] text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>

      <div className="space-y-5 px-4 pt-4 pb-6">
        {/* 다가오는 여행 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[15px] font-semibold text-[#0F1117]">{t('upcomingSection')}</span>
            {upcomingTrip && (
              <Link href={`/${locale}/trips`} className="text-[13px] font-medium text-[#1B6FF0]">
                {t('viewAll')}
              </Link>
            )}
          </div>

          {upcomingTrip ? (
            <Link
              href={`/${locale}/trips/${upcomingTrip.id}`}
              className="relative block overflow-hidden rounded-3xl border border-[#E8EAED] p-5"
              style={{ background: 'linear-gradient(135deg, #1B6FF014, #0F235120)' }}
            >
              {/* 배경 원 장식 */}
              <div
                className="pointer-events-none absolute -top-5 -right-5 h-36 w-36 rounded-full"
                style={{ background: 'linear-gradient(135deg, #EBF2FF, transparent)' }}
              />
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#EBF2FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B6FF0]">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#1B6FF0]" />
                {isTripOngoing(upcomingTrip.start_date, upcomingTrip.end_date)
                  ? t('badgeOngoing')
                  : t('badgePlanning')}
              </div>
              <p className="mb-1.5 text-[20px] font-bold tracking-tight text-[#0F1117]">
                {upcomingTrip.title}
              </p>
              <p className="mb-4 text-[13px] text-[#515966]">
                {formatDateRange(upcomingTrip.start_date, upcomingTrip.end_date, locale)}
                {upcomingTrip.start_date &&
                  !isTripOngoing(upcomingTrip.start_date, upcomingTrip.end_date) && (
                    <span className="ml-2 text-[#1B6FF0]">
                      · D-{daysUntil(upcomingTrip.start_date)}
                    </span>
                  )}
              </p>
              <div className="flex items-center justify-between">
                {/* 멤버 아바타 */}
                <div className="flex">
                  {upcomingTrip.trip_members.slice(0, 4).map((m, i) => (
                    <div
                      key={m.user_id}
                      className="h-7 w-7 rounded-full border-2 border-white"
                      style={{ backgroundColor: avatarColor(i), marginLeft: i > 0 ? -8 : 0 }}
                    />
                  ))}
                </div>
                {!isTripOngoing(upcomingTrip.start_date, upcomingTrip.end_date) &&
                  upcomingTrip.start_date && (
                    <span className="rounded-full bg-[#1B6FF0] px-3 py-1 text-[12px] font-semibold text-white">
                      D-{daysUntil(upcomingTrip.start_date)}
                    </span>
                  )}
              </div>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#E8EAED] bg-white py-8">
              <p className="text-[14px] text-[#9099A8]">{t('noUpcoming')}</p>
              <Link
                href={`/${locale}/trips/new`}
                className="rounded-full bg-[#1B6FF0] px-4 py-2 text-[13px] font-semibold text-white"
              >
                {t('newTrip')}
              </Link>
            </div>
          )}
        </div>

        {/* 빠른 메뉴 */}
        <div>
          <p className="mb-3 text-[15px] font-semibold text-[#0F1117]">{t('quickActions')}</p>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              {
                label: t('quickNewTrip'),
                href: `/${locale}/trips/new`,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path
                      d="M11 3v4M11 15v4M3 11h4M15 11h4M5.6 5.6l2.8 2.8M13.6 13.6l2.8 2.8M5.6 16.4l2.8-2.8M13.6 8.4l2.8-2.8"
                      stroke="#1B6FF0"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
              {
                label: t('quickExplore'),
                href: `/${locale}/places`,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path
                      d="M11 2C7.69 2 5 4.69 5 8c0 4.5 6 11 6 11s6-6.5 6-11c0-3.31-2.69-6-6-6z"
                      stroke="#515966"
                      strokeWidth="1.5"
                    />
                    <circle cx="11" cy="8" r="2" stroke="#515966" strokeWidth="1.5" />
                  </svg>
                ),
              },
              {
                label: t('quickItinerary'),
                href: `/${locale}/trips`,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path
                      d="M16 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"
                      stroke="#515966"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M8 6h6M8 10h6M8 14h4"
                      stroke="#515966"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
              {
                label: t('quickBacklog'),
                href: `/${locale}/backlog`,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path
                      d="M4 4h6v6H4zM12 4h6v6h-6zM4 12h6v6H4zM12 12h6v6h-6z"
                      stroke="#515966"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex h-13 w-13 items-center justify-center rounded-[14px] border border-[#E8EAED] bg-white shadow-sm">
                  {item.icon}
                </div>
                <span className="text-center text-[11px] font-medium text-[#515966]">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 저장한 장소 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[15px] font-semibold text-[#0F1117]">{t('backlogSection')}</span>
            {backlogItems.length > 0 && (
              <Link href={`/${locale}/backlog`} className="text-[13px] font-medium text-[#1B6FF0]">
                {t('viewAll')}
              </Link>
            )}
          </div>

          {backlogItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#E8EAED] bg-white py-8">
              <p className="text-[14px] text-[#9099A8]">{t('noBacklog')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {backlogItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-[#E8EAED] bg-white px-4 py-3.5"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#EBF2FF]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2C8.69 2 6 4.69 6 8c0 5 6 12 6 12s6-7 6-12c0-3.31-2.69-6-6-6z"
                        fill="#1B6FF0"
                        opacity=".3"
                      />
                      <circle cx="12" cy="8" r="2.5" fill="#1B6FF0" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[#0F1117]">
                      {item.places?.name ?? '알 수 없는 장소'}
                    </p>
                    {item.places?.address && (
                      <p className="truncate text-[12px] text-[#9099A8]">{item.places.address}</p>
                    )}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6 4l4 4-4 4"
                      stroke="#9099A8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

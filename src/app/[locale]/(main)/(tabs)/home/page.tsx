import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import dayjs from '@/lib/dayjs'
import { daysUntil, formatDateRange, isTripOngoing, isTripUpcoming } from '@/utils/date'
import {
  BellIcon,
  ChevronRightIcon,
  ExploreIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
} from '@/components/icons'
import { getCategoryInfoByLabel } from '@/utils/placeCategory'
import type { BacklogItemWithPlace, TripWithMembers } from '@/types/trip'

const AVATAR_COLORS = ['#1B6FF0', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2']

function greetingSubKey():
  | 'greetingMorning'
  | 'greetingAfternoon'
  | 'greetingEvening'
  | 'greetingNight' {
  const h = dayjs().hour()
  if (h >= 5 && h < 12) return 'greetingMorning'
  if (h >= 12 && h < 18) return 'greetingAfternoon'
  if (h >= 18 && h < 22) return 'greetingEvening'
  return 'greetingNight'
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
      .select('*, places(google_place_id, name, address, place_categories(name))')
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

  let memberInitials: string[] = []
  if (upcomingTrip && upcomingTrip.trip_members.length > 0) {
    const memberIds = upcomingTrip.trip_members.slice(0, 4).map((m) => m.user_id)
    const { data: memberProfiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', memberIds)
    const profileMap = new Map(memberProfiles?.map((p) => [p.id, p.name]) ?? [])
    memberInitials = upcomingTrip.trip_members
      .slice(0, 4)
      .map((m) => profileMap.get(m.user_id)?.[0] ?? '?')
  }

  const quickMenus = [
    {
      label: t('quickNewTrip'),
      href: `/${locale}/trips/new`,
      icon: <PlusIcon className="text-primary" />,
    },
    {
      label: t('quickExplore'),
      href: `/${locale}/places`,
      icon: <ExploreIcon className="text-ink2" />,
    },
    {
      label: t('quickItinerary'),
      href: `/${locale}/trips`,
      icon: <ListIcon className="text-ink2" />,
    },
    {
      label: t('quickBacklog'),
      href: `/${locale}/backlog`,
      icon: <GridIcon className="text-ink2" />,
    },
  ]

  return (
    <div className="bg-bg2 min-h-full">
      {/* 히어로 헤더 */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-7"
        style={{
          background:
            'linear-gradient(170deg, var(--color-hero-top) 0%, var(--color-hero-bot) 100%)',
        }}
      >
        <div
          className="bg-bg2 absolute right-0 bottom-0 left-0 h-7"
          style={{ borderRadius: '28px 28px 0 0' }}
        />
        <p className="mb-1 text-[13px] text-white/50">{t(greetingSubKey())}</p>
        <p className="text-[22px] font-bold tracking-tight text-white">
          {displayName ? t('greeting', { name: displayName }) : t('greetingDefault')}
        </p>
        {/* 벨 버튼: 디자인 background rgba(255,255,255,.12) / border rgba(255,255,255,.18) */}
        <Link
          href={`/${locale}/notifications`}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.18] bg-white/12"
        >
          <BellIcon size={18} className="text-white" />
          {unreadCount > 0 && (
            <span className="bg-error absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>

      <div className="space-y-5 px-4 pt-4 pb-6">
        {/* 다가오는 여행 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-ink text-[15px] font-semibold">{t('upcomingSection')}</span>
            {upcomingTrip && (
              <Link href={`/${locale}/trips`} className="text-primary text-[13px] font-medium">
                {t('viewAll')}
              </Link>
            )}
          </div>

          {upcomingTrip ? (
            <Link
              href={`/${locale}/trips/${upcomingTrip.id}`}
              className="border-border relative block overflow-hidden rounded-3xl border p-5"
              style={{
                // 디자인: linear-gradient(135deg, #1B6FF020, #0F235130) → 알파 0x20≈12.5%, 0x30≈18.8%
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12.5%, transparent), color-mix(in srgb, var(--color-hero-bot) 18.8%, transparent))',
              }}
            >
              <div
                className="pointer-events-none absolute -top-5 -right-5 h-36 w-36 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-light), transparent)',
                }}
              />
              {/* 트립 배지: 디자인 padding 3px 10px / gap 5px */}
              <div className="bg-primary-light text-primary mb-3 inline-flex items-center gap-[5px] rounded-full px-2.5 py-[3px] text-[11px] font-semibold">
                <span className="bg-primary inline-block h-1.5 w-1.5 animate-pulse rounded-full" />
                {isTripOngoing(upcomingTrip.start_date, upcomingTrip.end_date)
                  ? t('badgeOngoing')
                  : t('badgePlanning')}
              </div>
              <p className="text-ink mb-1.5 text-[20px] font-bold tracking-tight">
                {upcomingTrip.title}
              </p>
              {/* 트립 날짜: 디자인 margin-bottom 14px */}
              <p className="text-ink2 mb-3.5 text-[13px]">
                {formatDateRange(upcomingTrip.start_date, upcomingTrip.end_date, locale)}
                {upcomingTrip.start_date &&
                  !isTripOngoing(upcomingTrip.start_date, upcomingTrip.end_date) && (
                    <span className="text-primary ml-2">
                      · D-{daysUntil(upcomingTrip.start_date)}
                    </span>
                  )}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex">
                  {memberInitials.map((initial, i) => (
                    <div
                      key={i}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white"
                      style={{
                        backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                        marginLeft: i > 0 ? -8 : 0,
                      }}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                {!isTripOngoing(upcomingTrip.start_date, upcomingTrip.end_date) &&
                  upcomingTrip.start_date && (
                    <span className="bg-primary rounded-full px-3 py-1 text-[12px] font-semibold text-white">
                      D-{daysUntil(upcomingTrip.start_date)}
                    </span>
                  )}
              </div>
            </Link>
          ) : (
            <div className="border-border bg-bg flex flex-col items-center gap-3 rounded-3xl border py-8">
              <p className="text-ink3 text-[14px]">{t('noUpcoming')}</p>
              <Link
                href={`/${locale}/trips/new`}
                className="bg-primary rounded-full px-4 py-2 text-[13px] font-semibold text-white"
              >
                {t('newTrip')}
              </Link>
            </div>
          )}
        </div>

        {/* 빠른 메뉴 */}
        <div>
          <p className="text-ink mb-3 text-[15px] font-semibold">{t('quickActions')}</p>
          <div className="grid grid-cols-4 gap-2.5">
            {quickMenus.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1.5"
              >
                {/* 퀵 아이콘: 디자인 box-shadow 0 1px 4px rgba(0,0,0,.06) */}
                <div className="border-border bg-bg flex h-13 w-13 items-center justify-center rounded-[14px] border shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  {item.icon}
                </div>
                <span className="text-ink2 text-center text-[11px] font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 저장한 장소 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-ink text-[15px] font-semibold">{t('backlogSection')}</span>
            {backlogItems.length > 0 && (
              <Link href={`/${locale}/backlog`} className="text-primary text-[13px] font-medium">
                {t('viewAll')}
              </Link>
            )}
          </div>

          {backlogItems.length === 0 ? (
            <div className="border-border bg-bg flex flex-col items-center gap-3 rounded-3xl border py-8">
              <p className="text-ink3 text-[14px]">{t('noBacklog')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {backlogItems.map((item) => {
                const catLabel = item.places?.place_categories?.name ?? '기타'
                const category = getCategoryInfoByLabel(catLabel)
                const Icon = category.icon
                return (
                  <Link
                    key={item.id}
                    href={
                      item.places?.google_place_id
                        ? `/${locale}/places/${item.places.google_place_id}`
                        : `/${locale}/backlog`
                    }
                    className="border-border bg-bg flex items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80"
                  >
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] ${category.bg}`}
                    >
                      <Icon size={24} className={category.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate text-[14px] font-semibold">
                        {item.places?.name ?? '알 수 없는 장소'}
                      </p>
                      {item.places?.address && (
                        <p className="text-ink3 truncate text-[12px]">{item.places.address}</p>
                      )}
                      <p className={`mt-0.5 text-[11px] font-medium ${category.color}`}>
                        # {catLabel}
                      </p>
                    </div>
                    <ChevronRightIcon className="text-ink3" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

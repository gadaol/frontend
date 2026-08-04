import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { isTripOngoing, isTripUpcoming } from '@/utils/date'
import TripCard from '@/components/features/trips/TripCard'
import type { TripWithMembers, BacklogItemWithPlace } from '@/types/trip'

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

  const ongoingTrips = allTrips.filter((t) => isTripOngoing(t.start_date, t.end_date))
  const upcomingTrips = allTrips.filter((t) => isTripUpcoming(t.start_date))

  return (
    <div className="min-h-full bg-[#F5F6F8]">
      {/* 헤더 */}
      <div className="flex h-14 items-center justify-between bg-white px-5">
        <span className="text-[18px] font-bold text-[#0F1117]">
          {displayName ? t('greeting', { name: displayName }) : t('greetingDefault')}
        </span>
        <Link
          href={`/${locale}/notifications`}
          className="relative flex h-10 w-10 items-center justify-center"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M11 2a7 7 0 0 1 7 7v3l1.5 3H2.5L4 12V9a7 7 0 0 1 7-7z"
              stroke="#0F1117"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M9 18a2 2 0 0 0 4 0"
              stroke="#0F1117"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F04438] text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>

      <div className="space-y-6 px-5 py-5">
        {/* 진행 중인 여행 */}
        <Section
          title={t('ongoingSection')}
          viewAllHref={ongoingTrips.length > 0 ? `/${locale}/trips` : undefined}
          viewAllLabel={t('viewAll')}
        >
          {ongoingTrips.length === 0 ? (
            <EmptyCard message={t('noOngoing')} cta={t('newTrip')} href={`/${locale}/trips/new`} />
          ) : (
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
              {ongoingTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} locale={locale} variant="vertical" />
              ))}
            </div>
          )}
        </Section>

        {/* 예정된 여행 */}
        <Section
          title={t('upcomingSection')}
          viewAllHref={upcomingTrips.length > 0 ? `/${locale}/trips` : undefined}
          viewAllLabel={t('viewAll')}
        >
          {upcomingTrips.length === 0 ? (
            <EmptyCard message={t('noUpcoming')} cta={t('newTrip')} href={`/${locale}/trips/new`} />
          ) : (
            <div className="flex flex-col gap-2">
              {upcomingTrips.slice(0, 3).map((trip) => (
                <TripCard key={trip.id} trip={trip} locale={locale} variant="horizontal" />
              ))}
            </div>
          )}
        </Section>

        {/* 최근 저장한 장소 */}
        <Section
          title={t('backlogSection')}
          viewAllHref={backlogItems.length > 0 ? `/${locale}/backlog` : undefined}
          viewAllLabel={t('viewAll')}
        >
          {backlogItems.length === 0 ? (
            <EmptyCard message={t('noBacklog')} />
          ) : (
            <div className="flex flex-col divide-y divide-[#F5F6F8] rounded-2xl bg-white">
              {backlogItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#EBF2FF]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5z"
                        stroke="#1B6FF0"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                      <circle cx="8" cy="6" r="1.5" stroke="#1B6FF0" strokeWidth="1.3" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-[#0F1117]">
                      {item.places?.name ?? '알 수 없는 장소'}
                    </div>
                    {item.places?.address && (
                      <div className="truncate text-[12px] text-[#9099A8]">
                        {item.places.address}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  viewAllHref,
  viewAllLabel,
  children,
}: {
  title: string
  viewAllHref?: string
  viewAllLabel: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[15px] font-bold text-[#0F1117]">{title}</span>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-[13px] font-medium text-[#9099A8]">
            {viewAllLabel}
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyCard({ message, cta, href }: { message: string; cta?: string; href?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-8">
      <span className="text-[14px] text-[#9099A8]">{message}</span>
      {cta && href && (
        <Link
          href={href}
          className="rounded-full bg-[#1B6FF0] px-4 py-2 text-[13px] font-semibold text-white"
        >
          {cta}
        </Link>
      )}
    </div>
  )
}

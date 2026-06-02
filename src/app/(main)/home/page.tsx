import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bell, Plus, MapPin, Calendar } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Trip = Database['public']['Tables']['trips']['Row']

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id ?? ''

  // 프로필 조회
  const profileRes = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', userId)
    .single()
  const profile = profileRes.data

  // 내 여행 ID 목록
  const membershipRes = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', userId)
  const tripIds = (membershipRes.data ?? []).map((m) => m.trip_id)

  // 여행 상세
  let allTrips: Trip[] = []
  if (tripIds.length > 0) {
    const tripsRes = await supabase
      .from('trips')
      .select('*')
      .in('id', tripIds)
      .in('status', ['planning', 'ongoing'])
      .order('created_at', { ascending: false })
      .limit(5)
    allTrips = tripsRes.data ?? []
  }

  const ongoingTrips = allTrips.filter((t) => t.status === 'ongoing')
  const plannedTrips = allTrips.filter((t) => t.status === 'planning')

  // 읽지 않은 알림 수
  const notifRes = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  const unreadCount = notifRes.count ?? 0

  const displayName = profile?.name ?? user?.email?.split('@')[0] ?? '여행자'

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary">안녕하세요 👋</p>
          <h1 className="text-xl font-bold text-ink">{displayName}님</h1>
        </div>
        <Link href="/notifications" className="relative p-1">
          <Bell size={22} className="text-ink" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </header>

      {/* 진행 중인 여행 */}
      {ongoingTrips.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-secondary">진행 중인 여행</h2>
          <div className="space-y-2">
            {ongoingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} badge="진행 중" />
            ))}
          </div>
        </section>
      )}

      {/* 예정된 여행 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-secondary">예정된 여행</h2>
          <Link href="/trips" className="text-xs text-primary">
            전체 보기
          </Link>
        </div>

        {plannedTrips.length > 0 ? (
          <div className="space-y-2">
            {plannedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <EmptyTrips />
        )}
      </section>

      {/* FAB */}
      <Link
        href="/trips/new"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform active:scale-95"
        aria-label="새 여행 만들기"
      >
        <Plus size={24} className="text-white" />
      </Link>
    </div>
  )
}

function TripCard({ trip, badge }: { trip: Trip; badge?: string }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="block rounded-card border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink">{trip.title}</p>
            {badge && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                {badge}
              </span>
            )}
          </div>
          {(trip.start_date || trip.end_date) && (
            <div className="mt-1 flex items-center gap-1 text-xs text-secondary">
              <Calendar size={12} />
              <span>
                {trip.start_date ?? '?'} ~ {trip.end_date ?? '?'}
              </span>
            </div>
          )}
        </div>
        <MapPin size={16} className="mt-0.5 shrink-0 text-tertiary" />
      </div>
    </Link>
  )
}

function EmptyTrips() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border py-10">
      <p className="text-sm text-secondary">아직 여행이 없어요</p>
      <Link
        href="/trips/new"
        className="flex items-center gap-1.5 rounded-btn bg-primary px-4 py-2 text-sm font-medium text-white"
      >
        <Plus size={16} />
        여행 만들기
      </Link>
    </div>
  )
}

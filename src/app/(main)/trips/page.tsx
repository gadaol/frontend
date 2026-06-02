import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Calendar, Users } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Trip = Database['public']['Tables']['trips']['Row']

const STATUS_TABS = [
  { key: 'planning', label: '예정' },
  { key: 'ongoing', label: '진행 중' },
  { key: 'completed', label: '완료' },
] as const

type TabKey = (typeof STATUS_TABS)[number]['key']

type Props = {
  searchParams: Promise<{ tab?: string }>
}

export default async function TripsPage({ searchParams }: Props) {
  const { tab } = await searchParams
  const activeTab: TabKey =
    tab === 'ongoing' || tab === 'completed' ? tab : 'planning'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? ''

  // 내 여행 ID
  const { data: memberships } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', userId)
  const tripIds = (memberships ?? []).map((m) => m.trip_id)

  // 탭별 여행 조회
  let trips: Trip[] = []
  if (tripIds.length > 0) {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .in('id', tripIds)
      .eq('status', activeTab)
      .order('start_date', { ascending: true })
    trips = data ?? []
  }

  // 탭별 멤버 수 (count)
  const memberCountMap: Record<string, number> = {}
  if (trips.length > 0) {
    const { data: counts } = await supabase
      .from('trip_members')
      .select('trip_id')
      .in('trip_id', trips.map((t) => t.id))
    counts?.forEach((c) => {
      memberCountMap[c.trip_id] = (memberCountMap[c.trip_id] ?? 0) + 1
    })
  }

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-bold text-ink">여행</h1>
      </header>

      {/* 탭 */}
      <div className="flex border-b border-border px-4">
        {STATUS_TABS.map(({ key, label }) => (
          <Link
            key={key}
            href={`/trips?tab=${key}`}
            className={`relative mr-5 pb-3 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-primary after:content-[""]'
                : 'text-secondary hover:text-ink'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* 여행 리스트 */}
      <div className="flex-1 px-4 py-4">
        {trips.length > 0 ? (
          <div className="space-y-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} memberCount={memberCountMap[trip.id] ?? 1} />
            ))}
          </div>
        ) : (
          <EmptyState tab={activeTab} />
        )}
      </div>

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

function TripCard({ trip, memberCount }: { trip: Trip; memberCount: number }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="block overflow-hidden rounded-card border border-border bg-white shadow-sm transition-shadow hover:shadow-md active:scale-[0.99]"
    >
      {/* 커버 (없으면 색상 placeholder) */}
      <div className="h-32 w-full bg-gradient-to-br from-primary-light to-bg-subtle" />

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-semibold text-ink">{trip.title}</p>
            {(trip.start_date || trip.end_date) && (
              <div className="mt-1 flex items-center gap-1 text-xs text-secondary">
                <Calendar size={12} />
                <span>
                  {trip.start_date ?? '?'} ~ {trip.end_date ?? '?'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-secondary">
            <Users size={12} />
            <span>{memberCount}</span>
          </div>
        </div>

        {trip.status === 'ongoing' && (
          <span className="mt-2 inline-block rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            진행 중
          </span>
        )}
      </div>
    </Link>
  )
}

function EmptyState({ tab }: { tab: TabKey }) {
  const messages: Record<TabKey, string> = {
    planning: '예정된 여행이 없어요',
    ongoing: '진행 중인 여행이 없어요',
    completed: '완료된 여행이 없어요',
  }

  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <p className="text-sm text-secondary">{messages[tab]}</p>
      {tab === 'planning' && (
        <Link
          href="/trips/new"
          className="flex items-center gap-1.5 rounded-btn bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          <Plus size={16} />
          여행 만들기
        </Link>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Edit3, MapPin, UserPlus, Users } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Trip = Database['public']['Tables']['trips']['Row']
type TripMember = Database['public']['Tables']['trip_members']['Row']
type Profile = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'name' | 'avatar_url'>

type TripMemberWithProfile = TripMember & { profile: Omit<Profile, 'id'> | null }

type Props = { params: Promise<{ id: string }> }

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 여행 조회
  const { data: trip } = await supabase.from('trips').select('*').eq('id', id).single()
  if (!trip) notFound()

  // 멤버 조회
  const { data: membersData } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', id)
  const members = membersData ?? []

  // 내가 멤버인지 확인
  const isMember = members.some((m) => m.user_id === user?.id)
  if (!isMember) notFound()

  // 멤버 프로필 조회
  const memberIds = members.map((m) => m.user_id)
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', memberIds)
  const profileMap = Object.fromEntries((profilesData ?? []).map((p) => [p.id, p]))

  const membersWithProfile: TripMemberWithProfile[] = members.map((m) => ({
    ...m,
    profile: profileMap[m.user_id] ?? null,
  }))

  const myRole = members.find((m) => m.user_id === user?.id)?.role
  const canEdit = myRole === 'owner' || myRole === 'editor'

  // 일정 일자 수
  const { count: dayCount } = await supabase
    .from('itinerary_days')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', id)

  return (
    <div className="flex flex-col">
      {/* 커버 + 헤더 */}
      <div className="relative h-52 w-full bg-gradient-to-br from-primary-light via-bg-subtle to-primary/20">
        <Link
          href="/trips"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm"
        >
          <ArrowLeft size={18} className="text-ink" />
        </Link>

        {canEdit && (
          <Link
            href={`/trips/${id}/edit`}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm"
          >
            <Edit3 size={18} className="text-ink" />
          </Link>
        )}

        {/* 상태 뱃지 */}
        <div className="absolute bottom-4 left-4">
          <StatusBadge status={trip.status} />
        </div>
      </div>

      {/* 여행 정보 */}
      <div className="px-4 py-5">
        <h1 className="text-2xl font-bold text-ink">{trip.title}</h1>

        {(trip.start_date || trip.end_date) && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-secondary">
            <Calendar size={14} />
            <span>
              {trip.start_date ?? '?'} ~ {trip.end_date ?? '?'}
            </span>
          </div>
        )}

        {/* 멤버 아바타 */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {membersWithProfile.slice(0, 5).map((m) => (
              <Avatar key={m.id} name={m.profile?.name} avatarUrl={m.profile?.avatar_url} />
            ))}
            {membersWithProfile.length > 5 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-bg-subtle text-xs text-secondary">
                +{membersWithProfile.length - 5}
              </div>
            )}
          </div>
          <span className="text-sm text-secondary">
            <Users size={13} className="mr-1 inline" />
            {membersWithProfile.length}명
          </span>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* 액션 버튼 */}
      <div className="grid grid-cols-3 gap-3 px-4 py-5">
        <ActionButton
          href={`/trips/${id}/edit`}
          icon={<Edit3 size={18} />}
          label="일정 편집"
          disabled={!canEdit}
        />
        <ActionButton
          href={`/trips/${id}/places`}
          icon={<MapPin size={18} />}
          label="장소 탐색"
        />
        <ActionButton
          href={`/trips/${id}/invite`}
          icon={<UserPlus size={18} />}
          label="메이트 초대"
          disabled={!canEdit}
        />
      </div>

      <div className="h-px bg-border" />

      {/* 일정 요약 */}
      <div className="px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">일정</h2>
          <Link href={`/trips/${id}/edit`} className="text-xs text-primary">
            편집
          </Link>
        </div>

        {(dayCount ?? 0) > 0 ? (
          <p className="text-sm text-secondary">{dayCount}일 일정이 있어요</p>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border py-8">
            <p className="text-sm text-secondary">아직 일정이 없어요</p>
            {canEdit && (
              <Link href={`/trips/${id}/edit`} className="text-xs text-primary underline">
                일정 추가하기
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Trip['status'] }) {
  const map = {
    planning: { label: '계획 중', cls: 'bg-white/90 text-ink' },
    ongoing: { label: '진행 중', cls: 'bg-success/90 text-white' },
    completed: { label: '완료', cls: 'bg-ink/70 text-white' },
  }
  const { label, cls } = map[status]
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${cls}`}>
      {label}
    </span>
  )
}

function Avatar({ name, avatarUrl }: { name?: string | null; avatarUrl?: string | null }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name ?? ''} className="h-8 w-8 rounded-full border-2 border-white object-cover" />
  }
  const initials = name?.charAt(0)?.toUpperCase() ?? '?'
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-semibold text-white">
      {initials}
    </div>
  )
}

function ActionButton({
  href,
  icon,
  label,
  disabled,
}: {
  href: string
  icon: React.ReactNode
  label: string
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-card border border-border bg-bg-subtle py-4 opacity-40">
        <span className="text-ink">{icon}</span>
        <span className="text-xs text-secondary">{label}</span>
      </div>
    )
  }
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-card border border-border bg-white py-4 transition-colors hover:bg-bg-subtle active:scale-[0.98]"
    >
      <span className="text-ink">{icon}</span>
      <span className="text-xs text-secondary">{label}</span>
    </Link>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, ChevronRight, Crown } from 'lucide-react'
import { signOut } from '@/app/actions/auth'

export default async function MyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .single()

  const { count: tripCount } = await supabase
    .from('trip_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const displayName = profile?.name ?? user.email?.split('@')[0] ?? '여행자'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col">
      <header className="px-4 py-4">
        <h1 className="text-xl font-bold text-ink">마이페이지</h1>
      </header>

      {/* 프로필 카드 */}
      <div className="mx-4 rounded-card border border-border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-ink">{displayName}</p>
            <p className="text-sm text-secondary">{user.email}</p>
          </div>
        </div>

        {/* 통계 */}
        <div className="mt-4 flex divide-x divide-border rounded-btn bg-bg-subtle">
          <div className="flex flex-1 flex-col items-center py-3">
            <p className="text-xl font-bold text-ink">{tripCount ?? 0}</p>
            <p className="text-xs text-secondary">참여 여행</p>
          </div>
          <div className="flex flex-1 flex-col items-center py-3">
            <p className="text-xl font-bold text-ink">Free</p>
            <p className="text-xs text-secondary">플랜</p>
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      <div className="mx-4 mt-4 overflow-hidden rounded-card border border-border bg-white shadow-sm">
        <button className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-bg-subtle active:bg-bg-subtle">
          <div className="flex items-center gap-3">
            <Crown size={18} className="text-warning" />
            <span className="text-sm font-medium text-ink">Pro로 업그레이드</span>
          </div>
          <ChevronRight size={16} className="text-tertiary" />
        </button>

        <div className="h-px bg-border" />

        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-bg-subtle active:bg-bg-subtle"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} className="text-secondary" />
              <span className="text-sm font-medium text-ink">로그아웃</span>
            </div>
            <ChevronRight size={16} className="text-tertiary" />
          </button>
        </form>
      </div>
    </div>
  )
}

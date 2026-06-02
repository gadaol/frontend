import { createClient } from '@/lib/supabase/server'
import { Bell, MapPin, Vote, Edit3, Info } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Notification = Database['public']['Tables']['notifications']['Row']
type NotifType = Notification['type']

const ICON_MAP: Record<NotifType, React.ElementType> = {
  invite: Bell,
  vote: Vote,
  edit: Edit3,
  system: Info,
}

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.floor(hr / 24)}일 전`
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: notifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = (notifs ?? []) as Notification[]

  // 전체 읽음 처리 (페이지 진입 시)
  if (notifications.some((n) => !n.is_read)) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id ?? '')
      .eq('is_read', false)
  }

  return (
    <div className="flex flex-col">
      <header className="px-4 py-4">
        <h1 className="text-xl font-bold text-ink">알림</h1>
      </header>

      {notifications.length > 0 ? (
        <ul className="divide-y divide-border">
          {notifications.map((n) => {
            const Icon = ICON_MAP[n.type] ?? Info
            const payload = n.payload as Record<string, string> | null
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 px-4 py-4 ${n.is_read ? '' : 'bg-primary-light/30'}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-subtle">
                  <Icon size={16} className="text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ink">{payload?.message ?? n.type}</p>
                  <p className="mt-0.5 text-xs text-tertiary">{formatTime(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-20">
          <Bell size={36} className="text-tertiary" />
          <p className="text-sm text-secondary">알림이 없어요</p>
        </div>
      )}
    </div>
  )
}

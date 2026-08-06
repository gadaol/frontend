import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import NotificationsClient, { type Notification } from './_components/NotificationsClient'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const locale = await getLocale()
  if (!user) redirect(`/${locale}`)

  const { data } = await supabase
    .from('notifications')
    .select('id, type, payload, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications: Notification[] = (data ?? []) as Notification[]
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return <NotificationsClient notifications={notifications} unreadCount={unreadCount} />
}

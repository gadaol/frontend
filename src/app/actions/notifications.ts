'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type NotificationPrefs = {
  invite: boolean
  vote: boolean
  edit: boolean
  system: boolean
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { invite: true, vote: true, edit: true, system: true }

  const { data } = await supabase
    .from('user_preferences')
    .select('notification_prefs')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    (data?.notification_prefs as NotificationPrefs) ?? {
      invite: true,
      vote: true,
      edit: true,
      system: true,
    }
  )
}

export async function updateNotificationPrefs(prefs: NotificationPrefs) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, notification_prefs: prefs }, { onConflict: 'user_id' })

  revalidatePath('/notifications/settings', 'page')
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
  revalidatePath('/notifications', 'page')
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
  revalidatePath('/notifications', 'page')
}

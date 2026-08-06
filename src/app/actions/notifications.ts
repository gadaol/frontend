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

  revalidatePath('/', 'layout')
}

export async function acceptTripInvite(
  notificationId: string,
  tripId: string,
): Promise<{ error?: string; tripId?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: existing } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error } = await supabase
      .from('trip_members')
      .insert({ trip_id: tripId, user_id: user.id, role: 'member', status: 'accepted' })
    if (error) return { error: error.message }
  }

  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
  revalidatePath('/', 'layout')
  return { tripId }
}

export async function declineTripInvite(
  notificationId: string,
  tripId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .neq('role', 'owner')

  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
  revalidatePath('/', 'layout')
  return {}
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
  revalidatePath('/', 'layout')
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
  revalidatePath('/', 'layout')
}

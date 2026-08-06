'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function getOrCreateInviteToken(tripId: string): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: existing } = await supabase
    .from('trip_invites')
    .select('token')
    .eq('trip_id', tripId)
    .eq('created_by', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing.token

  const { data: newInvite } = await supabase
    .from('trip_invites')
    .insert({ trip_id: tripId, created_by: user.id })
    .select('token')
    .single()

  return newInvite?.token ?? null
}

export type InviteInfo = {
  token: string
  expires_at: string
  trips: {
    id: string
    title: string
    destination: string | null
    cover_url: string | null
    start_date: string | null
    end_date: string | null
    owner_id: string
  }
}

export async function getInviteInfo(token: string): Promise<InviteInfo | null> {
  const admin = adminClient()

  const { data: invite } = await admin
    .from('trip_invites')
    .select('token, expires_at, trip_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!invite) return null

  // trips RLS 우회: 비로그인 사용자도 초대 미리보기 가능해야 함
  const { data: trip } = await admin
    .from('trips')
    .select('id, title, destination, cover_url, start_date, end_date, owner_id')
    .eq('id', invite.trip_id)
    .maybeSingle()

  if (!trip) return null

  return {
    token: invite.token,
    expires_at: invite.expires_at,
    trips: trip,
  }
}

export type UserSearchResult = {
  id: string
  name: string | null
  avatar_url: string | null
  alreadyInvited: boolean
}


export async function searchUsers(
  tripId: string,
  query: string,
): Promise<UserSearchResult[]> {
  if (!query.trim()) return []
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const admin = adminClient()

  const [{ data: profiles }, { data: members }, { data: pendingNotifs }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, name, avatar_url, phone')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .neq('id', user.id)
      .limit(20),
    admin.from('trip_members').select('user_id').eq('trip_id', tripId),
    admin
      .from('notifications')
      .select('payload')
      .eq('type', 'invite')
      .eq('is_read', false)
      .filter('payload->>trip_id', 'eq', tripId),
  ])

  const memberIds = new Set((members ?? []).map((m) => m.user_id))
  const pendingIds = new Set(
    (pendingNotifs ?? []).map((n) => (n.payload as Record<string, unknown>).invited_user_id as string),
  )

  return (profiles ?? [])
    .filter((p) => !memberIds.has(p.id) && p.id !== user.id)
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatar_url: p.avatar_url,

      alreadyInvited: pendingIds.has(p.id),
    }))
}

export async function sendDirectInvite(
  tripId: string,
  targetUserId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  if (targetUserId === user.id) return { error: 'cannot_invite_self' }

  const admin = adminClient()

  const [{ data: trip }, { data: actor }, { data: existing }] = await Promise.all([
    admin.from('trips').select('id, title').eq('id', tripId).maybeSingle(),
    admin.from('profiles').select('name').eq('id', user.id).maybeSingle(),
    admin
      .from('notifications')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('type', 'invite')
      .eq('is_read', false)
      .filter('payload->>trip_id', 'eq', tripId)
      .maybeSingle(),
  ])

  if (!trip) return { error: 'trip_not_found' }
  if (existing) return { error: 'already_invited' }

  const { error } = await admin.from('notifications').insert({
    user_id: targetUserId,
    type: 'invite',
    payload: {
      trip_id: tripId,
      trip_name: trip.title,
      actor_id: user.id,
      actor_name: actor?.name ?? '누군가',
      invited_user_id: targetUserId,
    },
  })

  if (error) return { error: error.message }
  return {}
}

export async function acceptInvite(token: string): Promise<{ error?: string; tripId?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: invite } = await supabase
    .from('trip_invites')
    .select('trip_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!invite) return { error: 'invalid_token' }

  const { data: existing } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', invite.trip_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { tripId: invite.trip_id }

  const { error } = await supabase.from('trip_members').insert({
    trip_id: invite.trip_id,
    user_id: user.id,
    role: 'member',
    status: 'accepted',
  })

  if (error) return { error: error.message }
  return { tripId: invite.trip_id }
}

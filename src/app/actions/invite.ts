'use server'

import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()

  const { data: invite } = await supabase
    .from('trip_invites')
    .select('token, expires_at, trip_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!invite) return null

  const { data: trip } = await supabase
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

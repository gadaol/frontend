'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleVote(
  tripId: string,
  placeId: string,
  voteType: 'like' | 'dislike',
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: existing } = await supabase
    .from('votes')
    .select('id, vote_type')
    .eq('trip_id', tripId)
    .eq('place_id', placeId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    if (existing.vote_type === voteType) {
      await supabase.from('votes').delete().eq('id', existing.id)
    } else {
      await supabase.from('votes').update({ vote_type: voteType }).eq('id', existing.id)
    }
  } else {
    await supabase
      .from('votes')
      .insert({ trip_id: tripId, place_id: placeId, user_id: user.id, vote_type: voteType })
  }

  return { success: true } as { error?: string }
}

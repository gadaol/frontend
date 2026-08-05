'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getOrCreatePlace } from './backlog'
import { addItineraryItem } from './trip'

export async function addCandidatePlace(
  tripId: string,
  googlePlaceId: string,
  name: string,
  address: string,
  categoryName: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const placeId = await getOrCreatePlace({ googlePlaceId, name, address, categoryName })
  if (!placeId) return { error: 'place_failed' }

  const { error } = await supabase
    .from('trip_candidate_places')
    .insert({ trip_id: tripId, place_id: placeId, added_by: user.id })

  if (error && error.code !== '23505') return { error: error.message }
  revalidatePath('/', 'layout')
  return {}
}

export async function removeCandidatePlace(
  tripId: string,
  placeId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('trip_candidate_places')
    .delete()
    .eq('trip_id', tripId)
    .eq('place_id', placeId)

  if (error) return { error: error.message }
  return {}
}

export async function confirmCandidateToDay(
  tripId: string,
  placeId: string,
  dayDate: string,
  dayNumber: number,
): Promise<{ error?: string }> {
  const result = await addItineraryItem(tripId, dayDate, dayNumber, placeId)
  if (result.error) return { error: result.error }

  await removeCandidatePlace(tripId, placeId)
  return {}
}

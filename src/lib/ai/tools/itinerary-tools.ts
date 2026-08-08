import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database/database.types'

type DB = SupabaseClient<Database>

async function ensureDay(supabase: DB, tripId: string, dayDate: string, dayNumber: number) {
  const { data: existing } = await supabase
    .from('itinerary_days')
    .select('id')
    .eq('trip_id', tripId)
    .eq('day_date', dayDate)
    .single()

  if (existing) return existing.id

  const { data: created } = await supabase
    .from('itinerary_days')
    .insert({ trip_id: tripId, day_date: dayDate, day_number: dayNumber })
    .select('id')
    .single()

  return created?.id ?? null
}

async function getOrCreatePlace(
  supabase: DB,
  googlePlaceId: string,
  name: string,
  address?: string,
  lat?: number,
  lng?: number,
) {
  const { data: existing } = await supabase
    .from('places')
    .select('id')
    .eq('google_place_id', googlePlaceId)
    .single()

  if (existing) return existing.id

  const { data: newPlace } = await supabase
    .from('places')
    .insert({ google_place_id: googlePlaceId, name, address, lat, lng })
    .select('id')
    .single()

  return newPlace?.id ?? null
}

export function makeItineraryTools(supabase: DB, userId: string) {
  return {
    add_itinerary_item: tool({
      description:
        'Add a place to a specific day in the trip itinerary. Always confirm with user before calling.',
      inputSchema: z.object({
        tripId: z.string().uuid(),
        dayDate: z.string().describe('YYYY-MM-DD'),
        dayNumber: z.number(),
        googlePlaceId: z.string(),
        placeName: z.string(),
        address: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        visitTime: z.string().optional().describe('HH:MM format'),
        memo: z.string().optional(),
      }),
      execute: async ({
        tripId,
        dayDate,
        dayNumber,
        googlePlaceId,
        placeName,
        address,
        lat,
        lng,
        visitTime,
        memo,
      }) => {
        const dayId = await ensureDay(supabase, tripId, dayDate, dayNumber)
        if (!dayId) return { success: false, error: '일자 생성 실패' }

        const placeId = await getOrCreatePlace(
          supabase,
          googlePlaceId,
          placeName,
          address,
          lat,
          lng,
        )
        if (!placeId) return { success: false, error: '장소 저장 실패' }

        const { data: lastItem } = await supabase
          .from('itinerary_items')
          .select('order_index')
          .eq('day_id', dayId)
          .order('order_index', { ascending: false })
          .limit(1)
          .single()

        const orderIndex = (lastItem?.order_index ?? -1) + 1

        const { error } = await supabase.from('itinerary_items').insert({
          day_id: dayId,
          place_id: placeId,
          order_index: orderIndex,
          visit_time: visitTime ?? null,
          memo: memo ?? null,
        })

        if (error) return { success: false, error: error.message }

        supabase
          .from('place_interactions')
          .insert({
            user_id: userId,
            place_id: placeId,
            interaction_type: 'ai_added_to_itinerary',
          })
          .then(undefined, () => null)

        return { success: true, dayId, placeId, orderIndex }
      },
    }),

    remove_itinerary_item: tool({
      description: 'Remove an item from the itinerary. Always confirm with user before calling.',
      inputSchema: z.object({
        itemId: z.string().uuid(),
      }),
      execute: async ({ itemId }) => {
        const { error } = await supabase.from('itinerary_items').delete().eq('id', itemId)

        if (error) return { success: false, error: error.message }
        return { success: true }
      },
    }),
  }
}

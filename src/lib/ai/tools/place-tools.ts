import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database/database.types'

type DB = SupabaseClient<Database>

export function makePlaceTools(supabase: DB, userId: string) {
  return {
    search_places: tool({
      description: 'Search places using Google Places API based on a natural language query',
      inputSchema: z.object({
        query: z.string().describe('Search query, e.g. "분위기 좋은 제주 카페"'),
        location: z.string().optional().describe('Location to search near, e.g. "제주도"'),
      }),
      execute: async ({ query, location }) => {
        const q = location ? `${query} ${location}` : query
        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey) return { success: false, error: 'Places API not configured' }

        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.types,places.rating',
          },
          body: JSON.stringify({ textQuery: q, languageCode: 'ko', maxResultCount: 5 }),
        })

        if (!res.ok) return { success: false, error: 'Places API error' }
        const data = await res.json()

        return { success: true, places: data.places ?? [] }
      },
    }),

    add_to_candidates: tool({
      description: 'Add a place to the trip candidate list (backlog) for later consideration',
      inputSchema: z.object({
        tripId: z.string().uuid(),
        googlePlaceId: z.string(),
        placeName: z.string(),
        address: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      }),
      execute: async ({ tripId, googlePlaceId, placeName, address, lat, lng }) => {
        const { data: existing } = await supabase
          .from('places')
          .select('id')
          .eq('google_place_id', googlePlaceId)
          .single()

        let placeId = existing?.id

        if (!placeId) {
          const { data: newPlace } = await supabase
            .from('places')
            .insert({ google_place_id: googlePlaceId, name: placeName, address, lat, lng })
            .select('id')
            .single()
          placeId = newPlace?.id
        }

        if (!placeId) return { success: false, error: '장소 저장 실패' }

        const { error } = await supabase
          .from('trip_candidate_places')
          .insert({ trip_id: tripId, place_id: placeId, added_by: userId })

        if (error) return { success: false, error: error.message }

        supabase.from('place_interactions').insert({
          user_id: userId,
          place_id: placeId,
          interaction_type: 'ai_added_to_candidates',
        }).then(undefined, () => null)

        return { success: true, placeId }
      },
    }),
  }
}

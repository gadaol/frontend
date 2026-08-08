import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database/database.types'

type DB = SupabaseClient<Database>

export function makeTripTools(supabase: DB, userId: string) {
  return {
    get_user_profile: tool({
      description: 'Get current user profile and travel preferences',
      inputSchema: z.object({}),
      execute: async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, travel_companion, travel_pace, travel_places')
          .eq('id', userId)
          .single()

        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('character_id, category_weights, travel_style')
          .eq('user_id', userId)
          .single()

        return { success: true, profile, preferences: prefs }
      },
    }),

    get_user_trips: tool({
      description: "Get list of user's trips",
      inputSchema: z.object({
        status: z.enum(['planning', 'ongoing', 'completed']).optional(),
      }),
      execute: async ({ status }) => {
        let query = supabase
          .from('trips')
          .select('id, title, destination, start_date, end_date, status, cover_url')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })

        if (status) query = query.eq('status', status)

        const { data, error } = await query
        if (error) return { success: false, error: error.message }
        return { success: true, trips: data }
      },
    }),

    get_trip_detail: tool({
      description: 'Get detailed trip info including full itinerary',
      inputSchema: z.object({
        tripId: z.string().uuid(),
      }),
      execute: async ({ tripId }) => {
        const { data: trip, error } = await supabase
          .from('trips')
          .select(`
            id, title, destination, start_date, end_date, status,
            itinerary_days (
              id, day_date, day_number,
              itinerary_items (
                id, order_index, visit_time, memo,
                places ( id, name, address, google_place_id )
              )
            )
          `)
          .eq('id', tripId)
          .single()

        if (error) return { success: false, error: error.message }
        return { success: true, trip }
      },
    }),

    create_trip: tool({
      description: 'Create a new trip. Always confirm with user before calling.',
      inputSchema: z.object({
        title: z.string(),
        destination: z.string().optional(),
        startDate: z.string().optional().describe('YYYY-MM-DD'),
        endDate: z.string().optional().describe('YYYY-MM-DD'),
      }),
      execute: async ({ title, destination, startDate, endDate }) => {
        const { data: trip, error } = await supabase
          .from('trips')
          .insert({
            title,
            destination: destination ?? null,
            start_date: startDate ?? null,
            end_date: endDate ?? null,
            owner_id: userId,
          })
          .select('id, title')
          .single()

        if (error || !trip) return { success: false, error: error?.message ?? '여행 생성 실패' }

        await supabase.from('trip_members').insert({
          trip_id: trip.id,
          user_id: userId,
          role: 'owner',
        })

        return { success: true, tripId: trip.id, title: trip.title }
      },
    }),

    update_trip: tool({
      description: 'Update trip title, destination, or dates. Always confirm with user before calling.',
      inputSchema: z.object({
        tripId: z.string().uuid(),
        title: z.string().optional(),
        destination: z.string().optional(),
        startDate: z.string().optional().describe('YYYY-MM-DD'),
        endDate: z.string().optional().describe('YYYY-MM-DD'),
        status: z.enum(['planning', 'ongoing', 'completed']).optional(),
      }),
      execute: async ({ tripId, title, destination, startDate, endDate, status }) => {
        const updates: {
          title?: string
          destination?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'planning' | 'ongoing' | 'completed'
        } = {}
        if (title !== undefined) updates.title = title
        if (destination !== undefined) updates.destination = destination
        if (startDate !== undefined) updates.start_date = startDate
        if (endDate !== undefined) updates.end_date = endDate
        if (status !== undefined) updates.status = status

        const { error } = await supabase
          .from('trips')
          .update(updates)
          .eq('id', tripId)
          .eq('owner_id', userId)

        if (error) return { success: false, error: error.message }
        return { success: true }
      },
    }),
  }
}

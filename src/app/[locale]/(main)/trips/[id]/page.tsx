import { notFound, redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import TripDetailClient from './_components/TripDetailClient'
import type { Tables } from '@/types/database/database.types'

type ItineraryItem = Tables<'itinerary_items'> & {
  places:
    | (Pick<Tables<'places'>, 'id' | 'google_place_id' | 'name' | 'address'> & {
        place_categories: Pick<Tables<'place_categories'>, 'name'> | null
      })
    | null
}

type ItineraryDay = Pick<Tables<'itinerary_days'>, 'id' | 'day_number' | 'day_date'> & {
  itinerary_items: ItineraryItem[]
}

export type TripDetail = Tables<'trips'> & {
  trip_members: Pick<Tables<'trip_members'>, 'user_id' | 'role'>[]
  trip_tags: Pick<Tables<'trip_tags'>, 'tag'>[]
  itinerary_days: ItineraryDay[]
}

export type MemberProfile = { id: string; name: string | null }

export default async function TripDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const { data: trip } = await supabase
    .from('trips')
    .select(
      `*,
      trip_members(user_id, role),
      trip_tags(tag),
      itinerary_days(
        id, day_number, day_date,
        itinerary_items(
          id, order_index, visit_time, memo, place_id,
          places(id, google_place_id, name, address, place_categories(name))
        )
      )`,
    )
    .eq('id', id)
    .single()

  if (!trip) notFound()

  const memberIds = trip.trip_members.map((m) => m.user_id)
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', memberIds)

  const memberProfiles: MemberProfile[] = profileRows ?? []

  return (
    <TripDetailClient
      trip={trip as TripDetail}
      memberProfiles={memberProfiles}
      currentUserId={user.id}
    />
  )
}

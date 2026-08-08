import { notFound, redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import TripDetailClient from './_components/TripDetailClient'
import type { Tables } from '@/types/database/database.types'

type ItineraryItem = Tables<'itinerary_items'> & {
  places:
    | (Pick<
        Tables<'places'>,
        'id' | 'google_place_id' | 'name' | 'address' | 'lat' | 'lng' | 'photo_ref'
      > & {
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

export type TripExpense = Pick<
  Tables<'trip_expenses'>,
  'id' | 'amount' | 'category' | 'note' | 'item_id' | 'day_id'
>

export type MemberProfile = { id: string; name: string | null; avatar_url: string | null }

export type VoteEntry = { likes: number; dislikes: number; myVote: 'like' | 'dislike' | null }
export type VoteRecord = Record<string, VoteEntry>

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const [{ data: trip }, { data: profileRows }, { data: expenseRows }, { data: myProfile }] =
    await Promise.all([
      supabase
        .from('trips')
        .select(
          `*,
        trip_members(user_id, role),
        trip_tags(tag),
        itinerary_days(
          id, day_number, day_date,
          itinerary_items(
            id, order_index, visit_time, memo, place_id, item_type,
            places(id, google_place_id, name, address, lat, lng, photo_ref, place_categories(name))
          )
        )`,
        )
        .eq('id', id)
        .single(),
      supabase.from('profiles').select('id, name, avatar_url'),
      supabase
        .from('trip_expenses')
        .select('id, amount, category, note, item_id, day_id')
        .eq('trip_id', id),
      supabase.from('profiles').select('name, avatar_url').eq('id', user.id).maybeSingle(),
    ])

  if (!trip) notFound()

  const memberIds = trip.trip_members.map((m) => m.user_id)
  const memberProfiles: MemberProfile[] = (profileRows ?? []).filter((p) =>
    memberIds.includes(p.id),
  )

  return (
    <TripDetailClient
      trip={trip as TripDetail}
      memberProfiles={memberProfiles}
      currentUserId={user.id}
      currentUserAvatar={myProfile?.avatar_url ?? null}
      currentUserName={myProfile?.name ?? null}
      expenses={(expenseRows ?? []) as TripExpense[]}
    />
  )
}

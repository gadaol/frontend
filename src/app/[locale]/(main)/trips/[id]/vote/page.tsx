import { notFound, redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import VoteClient from './_components/VoteClient'
import type { VoteRecord } from '../page'

export type CandidatePlace = {
  id: string
  place_id: string
  places: {
    id: string
    google_place_id: string | null
    name: string
    address: string | null
    photo_ref: string | null
    place_categories: { name: string } | null
  } | null
}

export default async function VotePage({
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

  const [{ data: trip }, { data: candidatesRaw }, { data: votesRaw }] = await Promise.all([
    supabase
      .from('trips')
      .select(
        'id, title, start_date, end_date, trip_members(user_id), itinerary_days(id, day_number, day_date)',
      )
      .eq('id', id)
      .single(),
    supabase
      .from('trip_candidate_places')
      .select(
        'id, place_id, places(id, google_place_id, name, address, photo_ref, place_categories(name))',
      )
      .eq('trip_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('votes').select('place_id, vote_type, user_id').eq('trip_id', id),
  ])

  if (!trip) notFound()

  const isMember = trip.trip_members.some((m) => m.user_id === user.id)
  if (!isMember) redirect(`/${locale}`)

  const voteRecord: VoteRecord = {}
  for (const v of votesRaw ?? []) {
    const e = voteRecord[v.place_id] ?? { likes: 0, dislikes: 0, myVote: null }
    if (v.vote_type === 'like') e.likes++
    else e.dislikes++
    if (v.user_id === user.id) e.myVote = v.vote_type as 'like' | 'dislike'
    voteRecord[v.place_id] = e
  }

  return (
    <VoteClient
      tripId={id}
      tripTitle={trip.title}
      startDate={trip.start_date}
      endDate={trip.end_date}
      candidates={(candidatesRaw ?? []) as CandidatePlace[]}
      initialVotes={voteRecord}
      currentUserId={user.id}
    />
  )
}

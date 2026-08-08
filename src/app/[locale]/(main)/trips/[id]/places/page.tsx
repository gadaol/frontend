import { createClient } from '@/lib/supabase/server'
import { getTripDestination } from '@/app/actions/trip'
import PlacesPageClient from './_components/PlacesPageClient'

interface Props {
  params: Promise<{ id: string; locale: string }>
  searchParams: Promise<{ day?: string; date?: string }>
}

export default async function TripPlacesPage({ params, searchParams }: Props) {
  const { id: tripId } = await params
  const { day, date } = await searchParams

  const isCandidate = !day
  const dayNumber = parseInt(day ?? '1', 10)
  const dayDate = date ?? ''

  const [destination, supabase] = await Promise.all([getTripDestination(tripId), createClient()])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialAvatar: string | null = null
  let initialName: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    initialAvatar = profile?.avatar_url ?? null
    initialName = profile?.name ?? null
  }

  return (
    <PlacesPageClient
      tripId={tripId}
      dayNumber={dayNumber}
      dayDate={dayDate}
      isCandidate={isCandidate}
      destination={destination}
      initialAvatar={initialAvatar}
      initialName={initialName}
    />
  )
}

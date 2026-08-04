import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlaceDetailClient from './_components/PlaceDetailClient'

export type PlaceReview = {
  name: string
  relativePublishTimeDescription: string
  rating: number
  text?: { text: string; languageCode: string }
  authorAttribution: { displayName: string; photoUri?: string }
}

export type GooglePlaceDetail = {
  id: string
  displayName: { text: string }
  formattedAddress: string
  types: string[]
  rating?: number
  userRatingCount?: number
  internationalPhoneNumber?: string
  websiteUri?: string
  regularOpeningHours?: { weekdayDescriptions: string[] }
  reviews?: PlaceReview[]
}

async function fetchPlaceDetail(placeId: string): Promise<GooglePlaceDetail | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return null

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'id,displayName,formattedAddress,types,rating,userRatingCount,internationalPhoneNumber,websiteUri,regularOpeningHours,reviews',
      'Accept-Language': 'ko',
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) return null
  return res.json()
}

export default async function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [place, savedCheck] = await Promise.all([
    fetchPlaceDetail(id),
    user
      ? supabase
          .from('places')
          .select('id, backlog_items(id)')
          .eq('google_place_id', id)
          .eq('backlog_items.user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (!place) notFound()

  const initialSaved = !!(
    savedCheck.data?.backlog_items && (savedCheck.data.backlog_items as unknown[]).length > 0
  )

  return <PlaceDetailClient place={place} initialSaved={initialSaved} />
}

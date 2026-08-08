'use server'

import { createClient } from '@/lib/supabase/server'

export async function backfillPlacesPhotos(googlePlaceIds: string[]): Promise<void> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey || googlePlaceIds.length === 0) return

  const supabase = await createClient()

  await Promise.all(
    googlePlaceIds.map(async (googlePlaceId) => {
      try {
        const res = await fetch(`https://places.googleapis.com/v1/places/${googlePlaceId}`, {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,photos',
          },
          next: { revalidate: 86400 },
        })
        if (!res.ok) return
        const data = await res.json()
        const photoRef = data.photos?.[0]?.name
        if (photoRef) {
          await supabase
            .from('places')
            .update({ photo_ref: photoRef })
            .eq('google_place_id', googlePlaceId)
        }
      } catch {}
    }),
  )
}

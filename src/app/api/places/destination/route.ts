import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()
  if (!query) return NextResponse.json({ places: [] })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 503 })

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.types,places.rating,places.userRatingCount,places.location,places.photos',
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'ko',
      maxResultCount: 15,
    }),
  })

  if (!res.ok) return NextResponse.json({ places: [] })

  const data = await res.json()
  const places = (data.places ?? []).map(
    (place: Record<string, unknown> & { photos?: Array<{ name: string }> }) => ({
      ...place,
      photoRef: place.photos?.[0]?.name ?? null,
      photos: undefined, // 클라이언트로 전체 photos 배열 불필요
    }),
  )

  return NextResponse.json(
    { places },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  )
}

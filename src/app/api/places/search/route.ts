import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'

const CACHE_TTL = 3600 // 1시간

const searchPlaces = unstable_cache(
  async (query: string) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY!
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // photos 제외 — 유료 Advanced 필드 최소화
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.types,places.rating,places.userRatingCount,places.location,places.photos',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'ko',
        maxResultCount: 10,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.places ?? []
  },
  ['places-search'],
  { revalidate: CACHE_TTL, tags: ['places-search'] },
)

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (query.length < 2) {
    return NextResponse.json({ places: [] })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 503 })
  }

  const places = await searchPlaces(query)
  if (places === null) {
    return NextResponse.json({ error: 'Places API error' }, { status: 502 })
  }

  return NextResponse.json(
    { places },
    {
      headers: {
        // 브라우저 5분 캐시, CDN 1시간 캐시
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { searchPlacesText } from '@/lib/googlePlaces'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (query.length < 2) {
    return NextResponse.json({ places: [] })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 503 })
  }

  const places = await searchPlacesText(query)
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

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return new NextResponse(null, { status: 400 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return new NextResponse(null, { status: 503 })

  // skipHttpRedirect=true → JSON { photoUri } 반환 (API 키 없이 접근 가능한 CDN URL)
  const res = await fetch(
    `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=400&skipHttpRedirect=true&key=${apiKey}`,
    { next: { revalidate: 3600 } },
  )

  if (!res.ok) return new NextResponse(null, { status: 404 })

  const data = (await res.json()) as { photoUri?: string }
  if (!data.photoUri) return new NextResponse(null, { status: 404 })

  return NextResponse.redirect(data.photoUri, {
    headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
  })
}

import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return Response.json({ predictions: [] })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return Response.json({ predictions: [] })

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&types=(cities)&language=ko&key=${apiKey}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  const data = await res.json()

  const predictions = (data.predictions ?? []).map(
    (p: {
      place_id: string
      structured_formatting: { main_text: string; secondary_text?: string }
      description: string
    }) => ({
      placeId: p.place_id,
      mainText: p.structured_formatting.main_text,
      secondaryText: p.structured_formatting.secondary_text ?? '',
    }),
  )

  return Response.json({ predictions })
}

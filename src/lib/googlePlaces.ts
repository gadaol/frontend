import { unstable_cache } from 'next/cache'

const CACHE_TTL = 3600 // 1시간

export interface GooglePlaceResult {
  id: string
  displayName: { text: string }
  formattedAddress?: string
  location?: { latitude: number; longitude: number }
  types?: string[]
}

/**
 * Google Places Text Search. /api/places/search 라우트와 AI 일정 저장
 * 서버 액션이 함께 쓴다 — 검색 로직을 두 곳에 따로 두면 캐시 키나 필드마스크가
 * 갈라지기 쉬워서 여기 하나로 모았다.
 */
export const searchPlacesText = unstable_cache(
  async (query: string): Promise<GooglePlaceResult[] | null> => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) return null

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

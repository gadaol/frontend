import { generateObject } from 'ai'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { cerebras, MODELS } from '@/lib/ai/client'
import { getRecommendPrompt } from '@/lib/ai/prompts/recommend'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, canAccess, planGateResponse } from '@/lib/planGate'
import type { Locale } from '@/lib/ai/characters'

const COMPANION_LABELS: Record<string, string> = {
  solo: '혼자',
  couple: '둘이서',
  family: '가족과',
  friends: '친구들과',
  pet: '반려동물과',
}
const PACE_LABELS: Record<string, string> = {
  relaxed: '여유롭게',
  fast: '빠르게',
  planned: '계획파',
  spontaneous: '즉흥파',
  photo: '사진 중심',
}
const PLACE_LABELS: Record<string, string> = {
  restaurant: '맛집',
  cafe: '카페',
  nature: '자연',
  landmark: '관광지',
  shopping: '쇼핑',
  activity: '액티비티',
  culture: '박물관·전시',
  night: '야경·야간',
  healing: '온천·스파',
  market: '로컬 시장',
}

type PlaceWithCategory = { name: string; place_categories: { name: string } | null } | null

function formatPlace(p: PlaceWithCategory): string | null {
  if (!p) return null
  return p.place_categories?.name ? `${p.name}(${p.place_categories.name})` : p.name
}

export const RecommendSchema = z.object({
  intro: z.string().describe('사용자에게 건네는 추천 인사말 (1~2문장, 왜 이런 곳들을 골랐는지)'),
  places: z.array(
    z.object({
      name: z.string().describe('장소명 (공식 명칭)'),
      category: z
        .string()
        .describe('카테고리: 식당/카페/자연/관광지/쇼핑/액티비티/박물관/온천/기타 중 하나'),
      reason: z
        .string()
        .describe('이 사용자에게 맞는 구체적인 이유 (1~2문장. 취향·백로그·행동 데이터와 연결)'),
      tip: z.string().describe('방문 팁: 최적 시간대, 예약 여부, 주의사항 등 (1문장)'),
      googleSearchQuery: z
        .string()
        .describe('Google Places 검색어 ("장소명 도시명" 형식, 정확한 공식 명칭 사용)'),
    }),
  ),
})

export type RecommendResult = z.infer<typeof RecommendSchema>

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const plan = await getUserPlan(supabase, user.id)
  if (!canAccess(plan, 'pro')) return planGateResponse('pro')

  const {
    tripId,
    destination,
    categories = [],
    locale = 'ko',
  } = (await req.json()) as {
    tripId?: string
    destination?: string
    categories?: string[]
    locale?: Locale
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const [
    profileResult,
    backlogResult,
    likedResult,
    dislikedResult,
    interactionsResult,
    completedTripsResult,
    trendingResult,
  ] = await Promise.allSettled([
    supabase
      .from('profiles')
      .select('name, travel_companion, travel_pace, travel_places')
      .eq('id', user.id)
      .single(),

    supabase
      .from('backlog_items')
      .select('places(name, place_categories(name))')
      .eq('user_id', user.id)
      .not('place_id', 'is', null)
      .limit(30),

    supabase
      .from('votes')
      .select('places(name, place_categories(name))')
      .eq('user_id', user.id)
      .eq('vote_type', 'like')
      .limit(20),

    supabase
      .from('votes')
      .select('places(name)')
      .eq('user_id', user.id)
      .eq('vote_type', 'dislike')
      .limit(15),

    supabase
      .from('place_interactions')
      .select('interaction_type, places(name, place_categories(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('trips')
      .select('destination, itinerary_days(itinerary_items(places(name, place_categories(name))))')
      .eq('owner_id', user.id)
      .eq('status', 'completed')
      .limit(3),

    supabase
      .from('backlog_items')
      .select('place_id, places(name, place_categories(name))')
      .not('place_id', 'is', null)
      .gt('created_at', ninetyDaysAgo)
      .limit(500),
  ])

  const settled = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === 'fulfilled' ? r.value : null

  const profile = settled(profileResult)?.data ?? null
  const sections: string[] = []

  const prefLines = [
    profile?.travel_companion?.length
      ? `동행: ${profile.travel_companion.map((k) => COMPANION_LABELS[k] ?? k).join(', ')}`
      : '',
    profile?.travel_pace?.length
      ? `여행 페이스: ${profile.travel_pace.map((k) => PACE_LABELS[k] ?? k).join(', ')}`
      : '',
    profile?.travel_places?.length
      ? `선호 장소: ${profile.travel_places.map((k) => PLACE_LABELS[k] ?? k).join(', ')}`
      : '',
  ].filter(Boolean)
  if (prefLines.length) sections.push(`[사용자 취향]\n${prefLines.join('\n')}`)

  const backlogNames = (settled(backlogResult)?.data ?? [])
    .map((b) => formatPlace(b.places as PlaceWithCategory))
    .filter((x): x is string => x !== null)
  if (backlogNames.length) {
    sections.push(
      `[저장한 장소 백로그 — 의도 가장 높음]\n${backlogNames.map((n) => `- ${n}`).join('\n')}`,
    )
  }

  const likedNames = (settled(likedResult)?.data ?? [])
    .map((v) => formatPlace(v.places as PlaceWithCategory))
    .filter((x): x is string => x !== null)
  if (likedNames.length) {
    sections.push(`[좋아요한 장소 — 선호 확실]\n${likedNames.map((n) => `- ${n}`).join('\n')}`)
  }

  const dislikedNames = (settled(dislikedResult)?.data ?? [])
    .map((v) => formatPlace(v.places as PlaceWithCategory))
    .filter((x): x is string => x !== null)
  if (dislikedNames.length) {
    sections.push(`[싫어요한 장소 — 추천 제외]\n${dislikedNames.map((n) => `- ${n}`).join('\n')}`)
  }

  const interactionNames = (settled(interactionsResult)?.data ?? [])
    .map((i) => {
      const p = i.places as PlaceWithCategory
      if (!p) return null
      const label = i.interaction_type === 'ai_added_to_itinerary' ? '일정추가' : '후보추가'
      return `${p.name}(${label})`
    })
    .filter((x): x is string => x !== null)
  if (interactionNames.length) {
    sections.push(`[AI로 탐색한 장소]\n${interactionNames.map((n) => `- ${n}`).join('\n')}`)
  }

  type CompletedTrip = {
    destination: string | null
    itinerary_days: { itinerary_items: { places: PlaceWithCategory }[] }[]
  }
  const visitedLines = ((settled(completedTripsResult)?.data as CompletedTrip[]) ?? [])
    .map((trip) => {
      const names = trip.itinerary_days
        .flatMap((d) => d.itinerary_items)
        .map((item) => item.places?.name)
        .filter((x): x is string => Boolean(x))
        .slice(0, 6)
      if (!names.length) return null
      return `  - ${trip.destination ?? '여행'}: ${names.join(', ')}`
    })
    .filter((x): x is string => x !== null)
  if (visitedLines.length) {
    sections.push(`[실제 다녀온 여행]\n${visitedLines.join('\n')}`)
  }

  type TrendingRaw = { place_id: string | null; places: PlaceWithCategory }
  const knownNames = new Set([...backlogNames, ...likedNames, ...dislikedNames])
  const trendingCountMap = new Map<string, { name: string; category: string; count: number }>()
  for (const item of (settled(trendingResult)?.data as TrendingRaw[] | null) ?? []) {
    const id = item.place_id
    const p = item.places
    if (!id || !p) continue
    const existing = trendingCountMap.get(id)
    if (existing) {
      existing.count++
    } else {
      trendingCountMap.set(id, {
        name: p.name,
        category: p.place_categories?.name ?? '',
        count: 1,
      })
    }
  }
  const trendingPlaces = [...trendingCountMap.values()]
    .filter((p) => !knownNames.has(p.name))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
  if (trendingPlaces.length) {
    sections.push(
      `[요즘 많이 저장되는 장소 — 전체 유저 트렌드 (최근 90일)]\n` +
        trendingPlaces
          .map((p) => `- ${p.name}${p.category ? `(${p.category})` : ''} [${p.count}명 저장]`)
          .join('\n'),
    )
  }

  const userContext = sections.join('\n\n')
  const languageInstruction =
    locale === 'ko' ? '반드시 한국어로 답하세요.' : 'Always respond in English.'

  const system = [getRecommendPrompt(locale), userContext, languageInstruction]
    .filter(Boolean)
    .join('\n\n')

  const countInstruction =
    locale === 'ko' ? '장소는 정확히 6개를 추천한다.' : 'Recommend exactly 6 places.'

  const catFilter =
    categories.length > 0
      ? locale === 'ko'
        ? `카테고리 필터: 반드시 ${categories.join(', ')} 위주로 추천한다. 다른 카테고리는 포함하지 않는다.`
        : `Category filter: only recommend places in ${categories.join(', ')}. Do not include other categories.`
      : ''

  const prompt = (() => {
    const base = destination
      ? locale === 'ko'
        ? `${destination} 여행에 맞는 장소를 추천해줘.`
        : `Recommend places for a trip to ${destination}.`
      : tripId
        ? locale === 'ko'
          ? `여행 ID ${tripId}에 추가할 장소를 추천해줘.`
          : `Recommend places to add to trip ${tripId}.`
        : locale === 'ko'
          ? '내 취향과 지금까지 관심 보인 장소들을 바탕으로 가장 잘 맞는 장소를 추천해줘.'
          : 'Recommend places that best match my preferences and past interests.'
    return [base, countInstruction, catFilter].filter(Boolean).join('\n')
  })()

  try {
    const { object } = await generateObject({
      model: cerebras(MODELS.default),
      system,
      prompt,
      schema: RecommendSchema,
      abortSignal: AbortSignal.timeout(45_000),
      maxRetries: 2,
    })

    void supabase.from('recommendation_logs').insert({
      user_id: user.id,
      trip_id: tripId ?? null,
      recommended_places: { categories, destination, placeCount: object.places.length },
    })

    return NextResponse.json(object)
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === 'AbortError' || err.message.includes('timeout'))
    console.error('[recommend] AI error:', err)
    return NextResponse.json(
      { error: isTimeout ? 'timeout' : 'ai_failed' },
      { status: isTimeout ? 408 : 500 },
    )
  }
}

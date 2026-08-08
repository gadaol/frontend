import { streamText, isStepCount } from 'ai'
import { NextRequest } from 'next/server'
import { cerebras, MODELS } from '@/lib/ai/client'
import { getRecommendPrompt } from '@/lib/ai/prompts/recommend'
import { makePlaceTools } from '@/lib/ai/tools/place-tools'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/ai/characters'

const COMPANION_LABELS: Record<string, string> = {
  solo: '혼자', couple: '둘이서', family: '가족과', friends: '친구들과',
}
const PACE_LABELS: Record<string, string> = {
  relaxed: '여유롭게', fast: '빠르게', planned: '계획파', spontaneous: '즉흥파',
}
const PLACE_LABELS: Record<string, string> = {
  restaurant: '맛집', nature: '자연', cafe: '카페',
  landmark: '관광지', shopping: '쇼핑', activity: '액티비티',
}

type PlaceWithCategory = { name: string; place_categories: { name: string } | null } | null

function formatPlace(p: PlaceWithCategory): string | null {
  if (!p) return null
  return p.place_categories?.name ? `${p.name}(${p.place_categories.name})` : p.name
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { tripId, destination, locale = 'ko' } = await req.json() as {
    tripId?: string
    destination?: string
    locale?: Locale
  }

  const [
    profileResult,
    backlogResult,
    likedResult,
    dislikedResult,
    interactionsResult,
    completedTripsResult,
  ] = await Promise.all([
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
  ])

  const profile = profileResult.data
  const sections: string[] = []

  // 1. 사용자 취향 (온보딩/마이페이지 설정값)
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

  // 2. 백로그 — 직접 저장한 장소 (의도 가장 높음)
  const backlogNames = (backlogResult.data ?? [])
    .map((b) => formatPlace(b.places as PlaceWithCategory))
    .filter((x): x is string => x !== null)
  if (backlogNames.length) {
    sections.push(`[저장한 장소 백로그 — 의도 가장 높음]\n${backlogNames.map((n) => `- ${n}`).join('\n')}`)
  }

  // 3. 좋아요한 장소 — 명확한 선호
  const likedNames = (likedResult.data ?? [])
    .map((v) => formatPlace(v.places as PlaceWithCategory))
    .filter((x): x is string => x !== null)
  if (likedNames.length) {
    sections.push(`[좋아요한 장소 — 선호 확실]\n${likedNames.map((n) => `- ${n}`).join('\n')}`)
  }

  // 4. 싫어요한 장소 — 추천 제외
  const dislikedNames = (dislikedResult.data ?? [])
    .map((v) => formatPlace(v.places as PlaceWithCategory))
    .filter((x): x is string => x !== null)
  if (dislikedNames.length) {
    sections.push(`[싫어요한 장소 — 추천 제외]\n${dislikedNames.map((n) => `- ${n}`).join('\n')}`)
  }

  // 5. AI로 탐색/추가한 장소
  const interactionNames = (interactionsResult.data ?? [])
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

  // 6. 완료된 여행 — 실제 다녀온 장소
  type CompletedTrip = {
    destination: string | null
    itinerary_days: {
      itinerary_items: {
        places: PlaceWithCategory
      }[]
    }[]
  }
  const visitedLines = (completedTripsResult.data as CompletedTrip[] ?? [])
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

  const userContext = sections.join('\n\n')

  const languageInstruction = locale === 'ko' ? '반드시 한국어로 답하세요.' : 'Always respond in English.'

  const system = [getRecommendPrompt(locale), userContext, languageInstruction]
    .filter(Boolean)
    .join('\n\n')

  const prompt = (() => {
    if (destination) {
      return locale === 'ko'
        ? `${destination} 여행에 맞는 장소를 추천해줘.`
        : `Recommend places for a trip to ${destination}.`
    }
    if (tripId) {
      return locale === 'ko'
        ? `여행 ID ${tripId}에 추가할 장소를 추천해줘.`
        : `Recommend places to add to trip ${tripId}.`
    }
    return locale === 'ko'
      ? '내 취향과 지금까지 관심 보인 장소들을 바탕으로 가장 잘 맞는 장소를 추천해줘.'
      : 'Recommend places that best match my preferences and past interests.'
  })()

  const result = streamText({
    model: cerebras(MODELS.default),
    system,
    messages: [{ role: 'user', content: prompt }],
    tools: { search_places: makePlaceTools(supabase, user.id).search_places },
    stopWhen: isStepCount(3),
    onFinish: async ({ text }) => {
      await supabase.from('recommendation_logs').insert({
        user_id: user.id,
        trip_id: tripId ?? null,
        recommended_places: { summary: text.slice(0, 500) },
      })
    },
  })

  return result.toTextStreamResponse()
}

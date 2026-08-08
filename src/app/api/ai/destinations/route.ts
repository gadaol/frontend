import { generateText } from 'ai'
import { NextRequest } from 'next/server'
import { cerebras, MODELS } from '@/lib/ai/client'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, canAccess, planGateResponse, FEATURE_PLAN } from '@/lib/planGate'
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

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const plan = await getUserPlan(supabase, user.id)
  if (!canAccess(plan, FEATURE_PLAN.aiDestinations)) return planGateResponse(FEATURE_PLAN.aiDestinations)

  const {
    locale = 'ko',
    count = 6,
    exclude = [],
  } = (await req.json()) as {
    locale?: Locale
    count?: number
    exclude?: string[]
  }

  const [profileResult, backlogResult, likedResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('travel_companion, travel_pace, travel_places')
      .eq('id', user.id)
      .single(),
    supabase
      .from('backlog_items')
      .select('places(name)')
      .eq('user_id', user.id)
      .not('place_id', 'is', null)
      .limit(20),
    supabase
      .from('votes')
      .select('places(name)')
      .eq('user_id', user.id)
      .eq('vote_type', 'like')
      .limit(15),
  ])

  const profile = profileResult.data
  const prefLines = [
    profile?.travel_companion?.length
      ? `동행: ${profile.travel_companion.map((k: string) => COMPANION_LABELS[k] ?? k).join(', ')}`
      : '',
    profile?.travel_pace?.length
      ? `페이스: ${profile.travel_pace.map((k: string) => PACE_LABELS[k] ?? k).join(', ')}`
      : '',
    profile?.travel_places?.length
      ? `선호 장소: ${profile.travel_places.map((k: string) => PLACE_LABELS[k] ?? k).join(', ')}`
      : '',
  ].filter(Boolean)

  const backlogNames = (backlogResult.data ?? [])
    .map((b) => (b.places as { name: string } | null)?.name)
    .filter(Boolean)
  const likedNames = (likedResult.data ?? [])
    .map((v) => (v.places as { name: string } | null)?.name)
    .filter(Boolean)

  const context = [
    prefLines.length ? prefLines.join(', ') : '',
    backlogNames.length ? `저장 장소: ${backlogNames.join(', ')}` : '',
    likedNames.length ? `좋아요 장소: ${likedNames.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' / ')

  const excludeStr = exclude.length ? `제외 목적지: ${exclude.join(', ')}` : ''

  const prompt =
    locale === 'ko'
      ? `여행자 정보: ${context || '없음'}. ${excludeStr}
사용자 취향에 맞는 여행 목적지 도시/지역 ${count}곳을 한국어 이름으로 추천해줘.
반드시 JSON 배열만 반환해. 예시: ["제주도","도쿄","파리"]`
      : `Traveler info: ${context || 'none'}. ${excludeStr}
Recommend ${count} travel destinations in English names.
Return ONLY a JSON array. Example: ["Jeju","Tokyo","Paris"]`

  try {
    const { text } = await generateText({
      model: cerebras(MODELS.fast),
      messages: [{ role: 'user', content: prompt }],
      maxOutputTokens: 200,
    })

    const match = text.match(/\[[\s\S]*?\]/)
    const destinations: string[] = match ? JSON.parse(match[0]) : []
    return Response.json({ destinations: destinations.slice(0, count) })
  } catch {
    return Response.json({ destinations: [] })
  }
}

import { streamText, isStepCount } from 'ai'
import { NextRequest } from 'next/server'
import { cerebras, MODELS } from '@/lib/ai/client'
import { getRecommendPrompt } from '@/lib/ai/prompts/recommend'
import { makePlaceTools } from '@/lib/ai/tools/place-tools'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/ai/characters'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { tripId, locale = 'ko' } = await req.json() as {
    tripId?: string
    locale?: Locale
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, travel_companion, travel_pace, travel_places')
    .eq('id', user.id)
    .single()

  const { data: interactions } = await supabase
    .from('place_interactions')
    .select('place_id, interaction_type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const userContext = [
    profile?.travel_companion?.length ? `동행: ${profile.travel_companion.join(', ')}` : '',
    profile?.travel_pace?.length ? `여행 속도: ${profile.travel_pace.join(', ')}` : '',
    profile?.travel_places?.length ? `선호 장소: ${profile.travel_places.join(', ')}` : '',
    interactions?.length ? `최근 관심 장소 수: ${interactions.length}건` : '',
  ].filter(Boolean).join('\n')

  const languageInstruction = locale === 'ko' ? '반드시 한국어로 답하세요.' : 'Always respond in English.'

  const system = [getRecommendPrompt(locale), `[사용자 정보]\n${userContext}`, languageInstruction]
    .filter(Boolean)
    .join('\n\n')

  const prompt = locale === 'ko'
    ? tripId ? `여행 ID ${tripId}에 추가할 장소를 추천해줘.` : '내 취향에 맞는 장소를 추천해줘.'
    : tripId ? `Recommend places for trip ${tripId}.` : 'Recommend places based on my preferences.'

  const result = streamText({
    model: cerebras(MODELS.default),
    system,
    messages: [{ role: 'user', content: prompt }],
    tools: makePlaceTools(supabase, user.id),
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

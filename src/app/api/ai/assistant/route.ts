import { streamText, isStepCount, convertToModelMessages, type UIMessage } from 'ai'
import { NextRequest } from 'next/server'
import { cerebras, MODELS } from '@/lib/ai/client'
import {
  getCharacterPrompt,
  getVoicePrompt,
  type CharacterId,
  type Locale,
} from '@/lib/ai/characters'
import { getAssistantPrompt } from '@/lib/ai/prompts/assistant'
import { makePlaceTools } from '@/lib/ai/tools/place-tools'
import { makeTripTools } from '@/lib/ai/tools/trip-tools'
import { makeItineraryTools } from '@/lib/ai/tools/itinerary-tools'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const {
    messages: uiMessages,
    character,
    locale = 'ko',
    voice = false,
  } = (await req.json()) as {
    messages: UIMessage[]
    character: CharacterId
    locale?: Locale
    voice?: boolean
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, travel_companion, travel_pace, travel_places')
    .eq('id', user.id)
    .single()

  const userContext = profile
    ? `\n[사용자 정보]\n- 이름: ${profile.name ?? '미설정'}\n- 동행: ${profile.travel_companion?.join(', ') ?? '미설정'}\n- 여행 속도: ${profile.travel_pace?.join(', ') ?? '미설정'}\n- 선호 장소: ${profile.travel_places?.join(', ') ?? '미설정'}`
    : ''

  const languageInstruction =
    locale === 'ko' ? '반드시 한국어로 답하세요.' : 'Always respond in English.'

  const system = [
    voice ? getVoicePrompt(character, locale) : getCharacterPrompt(character, locale),
    getAssistantPrompt(locale),
    userContext,
    languageInstruction,
  ]
    .filter(Boolean)
    .join('\n\n')

  const tools = {
    ...makePlaceTools(supabase, user.id),
    ...makeTripTools(supabase, user.id),
    ...makeItineraryTools(supabase, user.id),
  }

  const recentMessages = await convertToModelMessages(uiMessages.slice(-20))

  const result = streamText({
    model: cerebras(MODELS.default),
    system,
    messages: recentMessages,
    tools,
    stopWhen: isStepCount(10),
  })

  return result.toUIMessageStreamResponse()
}

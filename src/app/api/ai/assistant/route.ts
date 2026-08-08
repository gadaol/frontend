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

/** KST 기준 오늘 날짜·요일과 이번 주말 날짜를 프롬프트에 넣을 문자열로 만든다. */
function buildDateContext(locale: Locale): string {
  const tz = 'Asia/Seoul'
  const now = new Date()
  const iso = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: tz }) // YYYY-MM-DD

  // KST 자정 기준 Date를 만들어 요일 계산이 UTC 오프셋에 흔들리지 않게 한다
  const todayKst = new Date(`${iso(now)}T00:00:00+09:00`)
  const dow = todayKst.getUTCDay() // 0=일
  const shift = (days: number) => {
    const d = new Date(todayKst)
    d.setUTCDate(d.getUTCDate() + days)
    return iso(d)
  }

  // 오늘이 토/일이면 '이번 주말'은 오늘이 속한 주말을 가리킨다
  const daysToSat = dow === 0 ? -1 : 6 - dow
  const weekendSat = shift(daysToSat)
  const weekendSun = shift(daysToSat + 1)

  const weekdayName = todayKst.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    timeZone: 'UTC',
    weekday: 'long',
  })

  return locale === 'ko'
    ? `\n[오늘 날짜]\n- 오늘: ${iso(now)} (${weekdayName})\n- 이번 주말: ${weekendSat} ~ ${weekendSun}\n- 연도를 말하지 않은 날짜는 오늘 이후 가장 가까운 날로 해석한다.`
    : `\n[Today]\n- Today: ${iso(now)} (${weekdayName}, KST)\n- This weekend: ${weekendSat} to ${weekendSun}\n- Dates without a year mean the nearest upcoming occurrence.`
}

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

  // 프롬프트가 "이번 주말" 같은 상대 표현을 실제 날짜로 환산하려면 오늘이 필요하다.
  // 사용자는 한국 기준이므로 KST로 고정한다.
  const dateContext = buildDateContext(locale)

  const languageInstruction =
    locale === 'ko' ? '반드시 한국어로 답하세요.' : 'Always respond in English.'

  const system = [
    voice ? getVoicePrompt(character, locale) : getCharacterPrompt(character, locale),
    getAssistantPrompt(locale),
    dateContext,
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

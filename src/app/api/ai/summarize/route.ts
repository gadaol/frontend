import { generateText } from 'ai'
import { NextRequest } from 'next/server'
import { cerebras, MODELS } from '@/lib/ai/client'
import { createClient } from '@/lib/supabase/server'
import { getCharacterPrompt, type CharacterId, type Locale } from '@/lib/ai/characters'

/**
 * 음성 대화 한 턴을 두 갈래로 압축한다.
 *
 * - spoken: 스피커로 읽어줄 한 문장. 답변 전문을 그대로 읽으면 너무 길어서
 *   듣는 사람이 놓친다.
 * - title/points: 화면에 쌓아둘 메모. 자세한 내용은 눈으로 보게 한다.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const {
    userText,
    assistantText,
    character = 'gada',
    locale = 'ko',
  } = (await req.json()) as {
    userText: string
    assistantText: string
    /** spoken이 캐릭터 말투를 유지해야 해서 함께 받는다 */
    character?: CharacterId
    locale?: Locale
  }

  if (!assistantText?.trim()) {
    return Response.json({ title: null, points: [], spoken: null })
  }

  const prompt =
    locale === 'ko'
      ? `아래는 여행 상담 음성 대화 한 토막이야.

사용자: ${userText}
답변: ${assistantText}

두 가지로 나눠서 줘.

1) spoken: 소리내어 읽어줄 한 문장. 40자 이내.
   - 답변의 핵심만. 목록·기호·이모지 금지.
   - 자세한 내용은 화면에 글로 보이니 말로는 요점만 짚고, 필요하면 되물어라.
   - **위 캐릭터의 말투를 그대로 유지해라.** 중립적인 요약체로 바꾸지 마라.
     (가다는 존댓말·부드럽게, 로그는 반말·짧고 툴툴대며)
2) 화면에 남길 메모
   - title: 8자 이내 핵심 주제
   - points: 기억할 내용 1~3개, 각 20자 이내. 인사말 빼고 정보만.

JSON만 반환. 예시:
{"spoken":"동쪽 위주로 3박 코스 잡아봤어요. 우도도 넣을까요?","title":"제주 3박4일","points":["동쪽 위주로 코스","우도 반나절 추천"]}`
      : `Here's one exchange from a travel voice chat.

User: ${userText}
Reply: ${assistantText}

Split it into two things.

1) spoken: one short sentence to say out loud. Under 90 chars.
   - The gist only. No lists, symbols, or emoji.
   - The details are already on screen, so speak the point and ask a follow-up if useful.
   - **Keep the character's voice above.** Do not flatten it into neutral summary prose.
2) A note for the screen
   - title: under 20 chars
   - points: 1-3 items, under 40 chars each. Facts only, no pleasantries.

Return JSON only. Example:
{"spoken":"I mapped out three nights around the east side. Want Udo in there?","title":"Jeju 3 nights","points":["Focus on east side","Udo half-day"]}`

  try {
    const { text } = await generateText({
      model: cerebras(MODELS.fast),
      system: getCharacterPrompt(character, locale),
      messages: [{ role: 'user', content: prompt }],
      maxOutputTokens: 260,
    })

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return Response.json({ title: null, points: [], spoken: null })

    const parsed = JSON.parse(match[0]) as {
      title?: string
      points?: string[]
      spoken?: string
    }
    return Response.json({
      title: parsed.title ?? null,
      points: (parsed.points ?? []).slice(0, 3),
      spoken: parsed.spoken?.trim() || null,
    })
  } catch {
    return Response.json({ title: null, points: [], spoken: null })
  }
}

import { generateText } from 'ai'
import { NextRequest } from 'next/server'
import { cerebras, MODELS } from '@/lib/ai/client'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/ai/characters'

/**
 * 음성 대화 한 턴을 채팅창에 남길 메모로 압축한다.
 * 대화는 흘러가고, 결론만 텍스트로 쌓이게 하는 게 목적.
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
    locale = 'ko',
  } = (await req.json()) as {
    userText: string
    assistantText: string
    locale?: Locale
  }

  if (!assistantText?.trim()) {
    return Response.json({ title: null, points: [] })
  }

  const prompt =
    locale === 'ko'
      ? `아래는 여행 상담 음성 대화 한 토막이야.

사용자: ${userText}
답변: ${assistantText}

이걸 나중에 다시 봤을 때 알아볼 수 있는 메모로 압축해줘.
- title: 8자 이내 핵심 주제
- points: 기억할 내용 1~3개, 각 20자 이내. 인사말이나 빈말은 빼고 정보만.

JSON만 반환. 예시: {"title":"제주 3박4일","points":["동쪽 위주로 코스","우도 반나절 추천"]}`
      : `Here's one exchange from a travel voice chat.

User: ${userText}
Reply: ${assistantText}

Compress it into a note that makes sense later.
- title: under 20 chars
- points: 1-3 items, under 40 chars each. Facts only, no pleasantries.

Return JSON only. Example: {"title":"Jeju 3 nights","points":["Focus on east side","Udo half-day"]}`

  try {
    const { text } = await generateText({
      model: cerebras(MODELS.fast),
      messages: [{ role: 'user', content: prompt }],
      maxOutputTokens: 200,
    })

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return Response.json({ title: null, points: [] })

    const parsed = JSON.parse(match[0]) as { title?: string; points?: string[] }
    return Response.json({
      title: parsed.title ?? null,
      points: (parsed.points ?? []).slice(0, 3),
    })
  } catch {
    return Response.json({ title: null, points: [] })
  }
}

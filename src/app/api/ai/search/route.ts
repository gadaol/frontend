import { streamText, isStepCount } from 'ai'
import { NextRequest } from 'next/server'
import { cerebras, MODELS } from '@/lib/ai/client'
import { getSearchPrompt } from '@/lib/ai/prompts/search'
import { makePlaceTools } from '@/lib/ai/tools/place-tools'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/ai/characters'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { query, locale = 'ko' } = await req.json() as {
    query: string
    locale?: Locale
  }

  const languageInstruction = locale === 'ko' ? '반드시 한국어로 답하세요.' : 'Always respond in English.'

  const system = [getSearchPrompt(locale), languageInstruction].join('\n\n')

  const result = streamText({
    model: cerebras(MODELS.default),
    system,
    messages: [{ role: 'user', content: query }],
    tools: { search_places: makePlaceTools(supabase, user.id).search_places },
    stopWhen: isStepCount(3),
  })

  return result.toTextStreamResponse()
}

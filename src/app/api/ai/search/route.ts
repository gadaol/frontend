import { generateObject } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { cerebras, MODELS } from '@/lib/ai/client'
import { getSearchPrompt } from '@/lib/ai/prompts/search'
import { RecommendSchema } from '@/app/api/ai/recommend/route'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, canAccess, planGateResponse, FEATURE_PLAN } from '@/lib/planGate'
import type { Locale } from '@/lib/ai/characters'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const plan = await getUserPlan(supabase, user.id)
  if (!canAccess(plan, FEATURE_PLAN.aiSearch)) return planGateResponse(FEATURE_PLAN.aiSearch)

  const { query, locale = 'ko' } = (await req.json()) as {
    query: string
    locale?: Locale
  }

  const languageInstruction =
    locale === 'ko' ? '반드시 한국어로 답하세요.' : 'Always respond in English.'

  const system = [getSearchPrompt(locale), languageInstruction].join('\n\n')

  try {
    const { object } = await generateObject({
      model: cerebras(MODELS.default),
      system,
      prompt: query,
      schema: RecommendSchema,
      abortSignal: AbortSignal.timeout(45_000),
      maxRetries: 2,
    })
    return NextResponse.json(object)
  } catch {
    return NextResponse.json({ error: 'ai_failed' }, { status: 500 })
  }
}

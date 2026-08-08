import { streamObject } from 'ai'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { cerebras, MODELS } from '@/lib/ai/client'
import { getItineraryPrompt } from '@/lib/ai/prompts/itinerary'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/ai/characters'

const ItineraryItemSchema = z.object({
  order_index: z.number(),
  place_name: z.string(),
  category: z.string(),
  visit_time: z.string().describe('HH:MM'),
  duration_minutes: z.number(),
  memo: z.string(),
  google_search_query: z.string().describe('Query to search this place on Google Places'),
})

const ItineraryDaySchema = z.object({
  day_number: z.number(),
  day_date: z.string().describe('YYYY-MM-DD'),
  theme: z.string(),
  items: z.array(ItineraryItemSchema),
})

const ItinerarySchema = z.object({
  title: z.string(),
  destination: z.string(),
  summary: z.string(),
  days: z.array(ItineraryDaySchema),
})

export type GeneratedItinerary = z.infer<typeof ItinerarySchema>

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const {
    destination,
    startDate,
    endDate,
    style = [],
    companion = '',
    notes = '',
    locale = 'ko',
  } = (await req.json()) as {
    destination: string
    startDate: string
    endDate: string
    style?: string[]
    companion?: string
    /** 사용자가 자유롭게 적은 추가 요청 (가고 싶은 곳, 피하고 싶은 것 등) */
    notes?: string
    locale?: Locale
  }

  const languageInstruction = locale === 'ko' ? '반드시 한국어로 작성하세요.' : 'Write in English.'

  const system = [getItineraryPrompt(locale), languageInstruction].join('\n\n')

  // 자유 입력은 길이를 제한해 프롬프트가 통째로 밀려나지 않게 한다
  const trimmedNotes = notes.trim().slice(0, 500)

  const userPrompt =
    locale === 'ko'
      ? [
          `목적지: ${destination}`,
          `기간: ${startDate} ~ ${endDate}`,
          `스타일: ${style.join(', ')}`,
          `동행: ${companion}`,
          trimmedNotes && `추가 요청(최우선 반영): ${trimmedNotes}`,
        ]
          .filter(Boolean)
          .join('\n')
      : [
          `Destination: ${destination}`,
          `Dates: ${startDate} to ${endDate}`,
          `Style: ${style.join(', ')}`,
          `Companion: ${companion}`,
          trimmedNotes && `Additional requests (prioritize these): ${trimmedNotes}`,
        ]
          .filter(Boolean)
          .join('\n')

  const result = streamObject({
    model: cerebras(MODELS.default),
    system,
    prompt: userPrompt,
    schema: ItinerarySchema,
  })

  return result.toTextStreamResponse()
}

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
    startTime = '',
    endTime = '',
    targetDates = [],
    excludePlaces = [],
    style = [],
    companion = '',
    notes = '',
    locale = 'ko',
  } = (await req.json()) as {
    destination: string
    startDate: string
    endDate: string
    /** 첫날 일정을 시작할 수 있는 시각 (도착 시간) */
    startTime?: string
    /** 마지막날 일정을 끝내야 하는 시각 (출발 시간) */
    endTime?: string
    /** 이 날짜들만 생성한다. 비면 전체 기간 */
    targetDates?: string[]
    /** 이미 여행에 담긴 장소명. 중복 추천을 막는다 */
    excludePlaces?: string[]
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
  // 장소가 많은 여행이면 목록이 프롬프트를 잡아먹으므로 상한을 둔다
  const excludeStr = excludePlaces.slice(0, 40).join(', ')

  const userPrompt =
    locale === 'ko'
      ? [
          `목적지: ${destination}`,
          targetDates.length > 0
            ? `아래 날짜만 짜라. 다른 날짜는 절대 포함하지 마라: ${targetDates.join(', ')}`
            : `기간: ${startDate} ~ ${endDate}`,
          `스타일: ${style.join(', ')}`,
          `동행: ${companion}`,
          excludeStr && `이미 이 여행에 담긴 장소다. 절대 다시 추천하지 마라: ${excludeStr}`,
          startTime && `첫날은 ${startTime}부터 일정 시작 가능 (그 이전 시간은 비워둘 것)`,
          endTime && `마지막날은 ${endTime}까지 일정 종료 (이후 시간은 비워둘 것)`,
          trimmedNotes && `추가 요청(최우선 반영): ${trimmedNotes}`,
        ]
          .filter(Boolean)
          .join('\n')
      : [
          `Destination: ${destination}`,
          targetDates.length > 0
            ? `Plan ONLY these dates, never include others: ${targetDates.join(', ')}`
            : `Dates: ${startDate} to ${endDate}`,
          `Style: ${style.join(', ')}`,
          `Companion: ${companion}`,
          excludeStr && `Already in this trip — never recommend these again: ${excludeStr}`,
          startTime && `Day 1 can only start at ${startTime} — leave earlier hours empty`,
          endTime && `The last day must wrap up by ${endTime} — leave later hours empty`,
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

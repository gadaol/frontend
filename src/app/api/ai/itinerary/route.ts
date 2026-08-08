import { streamObject } from 'ai'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { cerebras, MODELS } from '@/lib/ai/client'
import { getItineraryPrompt } from '@/lib/ai/prompts/itinerary'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, canAccess, planGateResponse, FEATURE_PLAN } from '@/lib/planGate'
import type { Locale } from '@/lib/ai/characters'

const ItineraryItemSchema = z.object({
  order_index: z.number(),
  place_name: z.string(),
  category: z.string(),
  visit_time: z.string().describe('HH:MM'),
  duration_minutes: z.number(),
  memo: z.string(),
  google_search_query: z.string().describe('Query to search this place on Google Places'),
  estimated_cost_krw: z
    .number()
    .describe(
      'Per-person estimated cost in KRW. Fill only when cost estimation is requested. Otherwise 0.',
    )
    .default(0),
  cost_category: z
    .string()
    .describe('Expense category: 식비/카페/숙박/교통/입장료/쇼핑/기타')
    .default('기타'),
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

  const plan = await getUserPlan(supabase, user.id)
  if (!canAccess(plan, FEATURE_PLAN.itinerary)) return planGateResponse(FEATURE_PLAN.itinerary)

  const {
    destination,
    segments,
    startDate,
    endDate,
    startTime = '',
    endTime = '',
    targetDays = [],
    excludePlaces = [],
    style = [],
    companion = '',
    notes = '',
    withCost = false,
    locale = 'ko',
  } = (await req.json()) as {
    destination: string
    /** 다중 목적지일 때 목적지별 날짜 범위. 단일 목적지면 undefined */
    segments?: Array<{ destination: string; dayStart: number; dayEnd: number }>
    startDate: string
    endDate: string
    startTime?: string
    endTime?: string
    targetDays?: Array<{ dayNumber: number; dayDate: string }>
    excludePlaces?: string[]
    style?: string[]
    companion?: string
    notes?: string
    withCost?: boolean
    locale?: Locale
  }

  const languageInstruction = locale === 'ko' ? '반드시 한국어로 작성하세요.' : 'Write in English.'

  const system = [getItineraryPrompt(locale), languageInstruction].join('\n\n')

  // 자유 입력은 길이를 제한해 프롬프트가 통째로 밀려나지 않게 한다
  const trimmedNotes = notes.trim().slice(0, 500)
  // 장소가 많은 여행이면 목록이 프롬프트를 잡아먹으므로 상한을 둔다
  const excludeStr = excludePlaces.slice(0, 40).join(', ')
  const targetStr = targetDays.map((d) => `${d.dayNumber}일차(${d.dayDate})`).join(', ')
  const targetStrEn = targetDays.map((d) => `day ${d.dayNumber} (${d.dayDate})`).join(', ')

  const segmentsKo = segments
    ? segments.map((s) => `- ${s.destination}: ${s.dayStart}일차~${s.dayEnd}일차`).join('\n')
    : null
  const segmentsEn = segments
    ? segments.map((s) => `- ${s.destination}: day ${s.dayStart}–day ${s.dayEnd}`).join('\n')
    : null

  const userPrompt =
    locale === 'ko'
      ? [
          segmentsKo
            ? `목적지(날짜별):\n${segmentsKo}\n위 날짜 범위에 맞게 각 도시의 장소를 배치하라. 예: 1~3일차는 도쿄 장소, 4~5일차는 오사카 장소만.`
            : `목적지: ${destination}`,
          `전체 여행 기간: ${startDate} ~ ${endDate}`,
          targetStr &&
            `이 중 아래 날만 짜라. 나머지 날은 이미 일정이 있으니 절대 포함하지 마라.\n` +
              `대상: ${targetStr}\n` +
              `각 day의 day_number와 day_date는 위에 적힌 값을 그대로 써라. 1일차부터 새로 번호를 붙이지 마라.`,
          `스타일: ${style.join(', ')}`,
          `동행: ${companion}`,
          excludeStr && `이미 이 여행에 담긴 장소다. 절대 다시 추천하지 마라: ${excludeStr}`,
          startTime && `첫날은 ${startTime}부터 일정 시작 가능 (그 이전 시간은 비워둘 것)`,
          endTime && `마지막날은 ${endTime}까지 일정 종료 (이후 시간은 비워둘 것)`,
          trimmedNotes && `추가 요청(최우선 반영): ${trimmedNotes}`,
          withCost &&
            `각 장소의 estimated_cost_krw에 1인 기준 현실적인 예상 비용(원화)을 설정하라. 무료이면 0. cost_category는 식비/카페/숙박/교통/입장료/쇼핑/기타 중 하나.`,
        ]
          .filter(Boolean)
          .join('\n')
      : [
          segmentsEn
            ? `Destinations by day:\n${segmentsEn}\nAssign places from the correct city for each day range. e.g. days 1–3 are Tokyo places, days 4–5 are Osaka places only.`
            : `Destination: ${destination}`,
          `Full trip range: ${startDate} to ${endDate}`,
          targetStrEn &&
            `Plan ONLY these days — the others already have plans, never include them.\n` +
              `Targets: ${targetStrEn}\n` +
              `Use exactly the day_number and day_date listed above. Do not renumber from day 1.`,
          `Style: ${style.join(', ')}`,
          `Companion: ${companion}`,
          excludeStr && `Already in this trip — never recommend these again: ${excludeStr}`,
          startTime && `Day 1 can only start at ${startTime} — leave earlier hours empty`,
          endTime && `The last day must wrap up by ${endTime} — leave later hours empty`,
          trimmedNotes && `Additional requests (prioritize these): ${trimmedNotes}`,
          withCost &&
            `For each place, set estimated_cost_krw to the realistic per-person cost in KRW (0 if free). Set cost_category to one of: 식비/카페/숙박/교통/입장료/쇼핑/기타.`,
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

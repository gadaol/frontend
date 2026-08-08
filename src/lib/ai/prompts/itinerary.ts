import type { Locale } from '../characters'

const ITINERARY: Record<Locale, string> = {
  ko: `여행 조건에 맞는 상세 일정을 생성합니다.

[원칙]
- 가까운 장소끼리 묶어 이동 시간 최소화
- 오전/오후/저녁 시간대 균형 배분
- 식사 시간 포함 (아침 08:30, 점심 12:00, 저녁 18:30 기준)
- 동행 유형과 여행 스타일 반영
- 각 장소마다 방문 소요 시간 명시`,

  en: `Generate a detailed day-by-day travel itinerary.

[Principles]
- Group nearby places to minimize travel time
- Balance morning/afternoon/evening slots
- Include meal times (breakfast 08:30, lunch 12:00, dinner 18:30)
- Reflect companion type and travel style
- Specify estimated visit duration for each place`,
}

export function getItineraryPrompt(locale: Locale): string {
  return ITINERARY[locale]
}

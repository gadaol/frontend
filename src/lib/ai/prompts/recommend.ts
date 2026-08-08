import type { Locale } from '../characters'

const RECOMMEND: Record<Locale, string> = {
  ko: `사용자의 여행 스타일과 선호도를 기반으로 장소를 추천합니다.
제공된 유저 컨텍스트(동행 유형, 여행 속도, 선호 장소)를 적극 활용하세요.
각 장소가 왜 이 사용자에게 맞는지 이유를 구체적으로 설명합니다.`,

  en: `Recommend places based on the user's travel style and preferences.
Actively use the provided user context (companion type, travel pace, preferred places).
Explain specifically why each place suits this user.`,
}

export function getRecommendPrompt(locale: Locale): string {
  return RECOMMEND[locale]
}

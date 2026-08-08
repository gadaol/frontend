import type { Locale } from '../characters'

const SEARCH: Record<Locale, string> = {
  ko: `사용자의 자연어 장소 검색 쿼리를 처리합니다.
search_places 도구를 사용해 적절한 장소를 찾고, 각 장소가 왜 검색 의도에 맞는지 간략히 설명합니다.
결과가 없으면 비슷한 검색어를 제안합니다.`,

  en: `Process natural language place search queries.
Use search_places tool to find relevant places and briefly explain why each matches the search intent.
If no results, suggest alternative search terms.`,
}

export function getSearchPrompt(locale: Locale): string {
  return SEARCH[locale]
}

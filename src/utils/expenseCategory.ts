/**
 * 경비 카테고리.
 *
 * 저장되는 값 자체는 한국어 문자열이다 (trip_expenses.category).
 * 이미 쌓인 데이터가 있어 값을 바꾸지 않고, 화면에 보여줄 때만 번역한다.
 * 그래서 값 → 번역키 매핑을 따로 둔다.
 */
export const EXPENSE_CATEGORIES = [
  '식비',
  '카페',
  '숙박',
  '교통',
  '입장료',
  '쇼핑',
  '기타',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

const TRANSLATION_KEY: Record<ExpenseCategory, string> = {
  식비: 'food',
  카페: 'cafe',
  숙박: 'stay',
  교통: 'transport',
  입장료: 'ticket',
  쇼핑: 'shopping',
  기타: 'etc',
}

/** trips 네임스페이스 기준 키 (`expense.food` 형태) */
export function expenseCategoryKey(category: string): string {
  return `expense.${TRANSLATION_KEY[category as ExpenseCategory] ?? 'etc'}`
}

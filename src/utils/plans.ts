import type { BadgeProps } from '@/components/ui/Badge'

export type Plan = 'free' | 'pro' | 'plus'

export const PLAN_KEYS: Plan[] = ['free', 'pro', 'plus']

/** MypageClient 등 기존(비-i18n) 화면에서 계속 쓰는 라벨 — 신규 화면은 subscription.planLabel.* 번역 사용 */
export const PLAN_LABEL: Record<Plan, string> = { free: 'Free', pro: 'Pro', plus: 'Plus' }

export const PLAN_BADGE_VARIANT: Record<Plan, NonNullable<BadgeProps['variant']>> = {
  free: 'gray',
  pro: 'blue',
  plus: 'purple',
}

/** 월 결제 금액 (원). 표시 문자열은 각 화면에서 번역/포맷팅. */
export const PLAN_PRICE: Record<Plan, number> = { free: 0, pro: 3900, plus: 6900 }

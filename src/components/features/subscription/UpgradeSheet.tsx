'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import type { Plan } from '@/utils/plans'

const PLAN_COLOR: Record<Plan, string> = {
  free: 'var(--color-ink3)',
  pro: '#2563EB',
  plus: '#7C3AED',
}

/**
 * 게이트에 걸린 기능의 키. 라벨은 mypage.upgradeSheet.feature.* 에서 번역한다.
 * 대부분 FEATURE_PLAN의 키와 1:1이고, tripLimit만 무료 여행 개수 제한용으로 추가된 것이다.
 */
export type UpgradeFeature =
  | 'collection'
  | 'invite'
  | 'expense'
  | 'multiDestination'
  | 'characterRog'
  | 'aiSearch'
  | 'aiRecommend'
  | 'voice'
  | 'itinerary'
  | 'tripLimit'

interface Props {
  required: Plan
  feature: UpgradeFeature
  onClose: () => void
  /** 업그레이드 버튼을 눌러 실제로 이동할 때만 호출된다. 취소·백드롭에서는 호출되지 않는다. */
  onNavigate?: () => void
}

export default function UpgradeSheet({ required, feature, onClose, onNavigate }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('mypage.subscription')

  const planLabel = t(`planLabel.${required}`)

  function goUpgrade() {
    onClose()
    onNavigate?.()
    router.push(
      `/${locale}/mypage/subscription?tab=${required}&from=${encodeURIComponent(pathname)}`,
    )
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg rounded-t-2xl bg-white px-6 pt-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase"
            style={{ background: PLAN_COLOR[required] }}
          >
            {planLabel}
          </span>
          <span className="text-ink text-[15px] font-semibold">{t('upgradeSheet.exclusive')}</span>
        </div>
        <p className="text-ink2 mt-1 text-[14px]">
          {t.rich('upgradeSheet.body', {
            feature: t(`upgradeSheet.feature.${feature}`),
            plan: planLabel,
            feat: (chunks) => <strong className="text-ink">{chunks}</strong>,
            hl: (chunks) => (
              <span style={{ color: PLAN_COLOR[required], fontWeight: 700 }}>{chunks}</span>
            ),
          })}
        </p>
        <button
          onClick={goUpgrade}
          className="mt-5 w-full rounded-xl py-3.5 text-[15px] font-bold text-white"
          style={{ background: PLAN_COLOR[required] }}
        >
          {t('upgradeSheet.cta', { plan: planLabel })}
        </button>
        <button onClick={onClose} className="text-ink3 mt-3 w-full py-2 text-[14px]">
          {t('upgradeSheet.later')}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import type { Plan } from '@/utils/plans'

const PLAN_COLOR: Record<Plan, string> = {
  free: 'var(--color-ink3)',
  pro: '#2563EB',
  plus: '#7C3AED',
}

const PLAN_LABEL: Record<Plan, string> = { free: 'Free', pro: 'Pro', plus: 'Plus' }

interface Props {
  required: Plan
  feature: string
  onClose: () => void
}

export default function UpgradeSheet({ required, feature, onClose }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const pathname = usePathname()

  function goUpgrade() {
    onClose()
    router.push(
      `/${locale}/mypage/subscription?tab=${required}&from=${encodeURIComponent(pathname)}`
    )
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg rounded-t-2xl bg-white px-6 pb-10 pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
            style={{ background: PLAN_COLOR[required] }}
          >
            {PLAN_LABEL[required]}
          </span>
          <span className="text-ink text-[15px] font-semibold">전용 기능</span>
        </div>
        <p className="text-ink2 mt-1 text-[14px]">
          <strong className="text-ink">{feature}</strong>은{' '}
          <span style={{ color: PLAN_COLOR[required], fontWeight: 700 }}>
            {PLAN_LABEL[required]}
          </span>{' '}
          플랜부터 사용할 수 있어요.
        </p>
        <button
          onClick={goUpgrade}
          className="mt-5 w-full rounded-xl py-3.5 text-[15px] font-bold text-white"
          style={{ background: PLAN_COLOR[required] }}
        >
          {PLAN_LABEL[required]} 업그레이드
        </button>
        <button
          onClick={onClose}
          className="text-ink3 mt-3 w-full py-2 text-[14px]"
        >
          나중에
        </button>
      </div>
    </div>
  )
}

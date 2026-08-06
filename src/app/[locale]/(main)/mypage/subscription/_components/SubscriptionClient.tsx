'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import AppHeader from '@/components/common/AppHeader'
import Tabs, { type TabItem } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PLAN_KEYS, PLAN_BADGE_VARIANT, PLAN_PRICE, type Plan } from '@/utils/plans'

interface Props {
  plan: Plan
  isTrial: boolean
}

export default function SubscriptionClient({ plan, isTrial }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('mypage.subscription')
  const [activeTab, setActiveTab] = useState<Plan>(plan)

  const tabItems: TabItem<Plan>[] = PLAN_KEYS.map((key) => ({
    key,
    label: t(`planLabel.${key}`),
  }))
  const isCurrentPlan = activeTab === plan
  const price = activeTab === 'free' ? t('free') : `₩${PLAN_PRICE[activeTab].toLocaleString()}`
  const features = t.raw(`benefits.${activeTab}`) as string[]

  return (
    <div className="bg-bg2 flex min-h-dvh flex-col">
      <AppHeader title={t('title')} onBack="router" border />

      <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} fullWidth />

      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="border-border rounded-2xl border bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={PLAN_BADGE_VARIANT[activeTab]}>{t(`planLabel.${activeTab}`)}</Badge>
              {isCurrentPlan && (
                <span className="text-ink3 text-[12px]">
                  {t('currentPlan')}
                  {isTrial && activeTab !== 'free' ? t('trialSuffix') : ''}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-ink text-[22px] font-black">{price}</span>
              {activeTab !== 'free' && (
                <span className="text-ink3 ml-1 text-[13px]">{t('perMonth')}</span>
              )}
            </div>
          </div>

          <ul className="space-y-2">
            {features.map((f) => (
              <li key={f} className="text-ink2 flex items-center gap-2 text-[14px]">
                <span className="text-primary">✓</span> {f}
              </li>
            ))}
          </ul>

          {!isCurrentPlan && activeTab !== 'free' && (
            <Button
              onClick={() => router.push(`/${locale}/payment?plan=${activeTab}`)}
              fullWidth
              className="mt-5"
            >
              {t('upgradeButton', { plan: t(`planLabel.${activeTab}`) })}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

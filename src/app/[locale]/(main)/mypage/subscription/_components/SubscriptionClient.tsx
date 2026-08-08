'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import AppHeader from '@/components/common/AppHeader'
import Tabs, { type TabItem } from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PLAN_KEYS, PLAN_BADGE_VARIANT, PLAN_PRICE, type Plan } from '@/utils/plans'

const YEARLY_PRICE: Partial<Record<Plan, number>> = { pro: 29900, plus: 59900 }
import { cancelSubscription } from '@/app/actions/mypage'

interface PaymentRow {
  id: string
  plan: string
  period: string
  amount: number
  status: string
  approved_at: string | null
}

interface Props {
  plan: Plan
  isTrial: boolean
  isCanceled: boolean
  period: 'monthly' | 'yearly'
  expiresAt: string | null
  canceledAt: string | null
  cardCompany: string | null
  cardNumber: string | null
  payments: PaymentRow[]
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatAmount(amount: number) {
  return `₩${amount.toLocaleString()}`
}

export default function SubscriptionClient({
  plan,
  isTrial,
  isCanceled,
  period,
  expiresAt,
  canceledAt,
  cardCompany,
  cardNumber,
  payments,
}: Props) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('mypage.subscription')
  const [activeTab, setActiveTab] = useState<Plan>(plan)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const tabItems: TabItem<Plan>[] = PLAN_KEYS.map((key) => ({
    key,
    label: t(`planLabel.${key}`),
  }))

  const isCurrentPlan = activeTab === plan
  const isPaid = plan !== 'free'
  const features = t.raw(`benefits.${activeTab}`) as string[]
  const periodLabel = period === 'yearly' ? t('billingYearly') : t('billingMonthly')

  function getPrice(tab: Plan) {
    if (tab === 'free') return t('free')
    // 현재 플랜 탭이고 연간 구독이면 연간 가격 표시
    if (tab === plan && period === 'yearly') {
      const yearly = YEARLY_PRICE[tab]
      return yearly ? `₩${yearly.toLocaleString()}` : `₩${PLAN_PRICE[tab].toLocaleString()}`
    }
    return `₩${PLAN_PRICE[tab].toLocaleString()}`
  }

  const price = getPrice(activeTab)
  const priceUnit =
    activeTab === 'free' ? '' : isCurrentPlan && period === 'yearly' ? t('perYear') : t('perMonth')

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelSubscription()
      if (!result.error) {
        setShowCancelConfirm(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-bg2 flex min-h-dvh flex-col">
      <AppHeader title={t('title')} onBack="router" border />

      <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} fullWidth />

      <div className="flex flex-col gap-4 px-4 py-5 pb-10">
        {/* 플랜 카드 */}
        <div className="border-border rounded-2xl border bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={PLAN_BADGE_VARIANT[activeTab]}>{t(`planLabel.${activeTab}`)}</Badge>
              {isCurrentPlan && (
                <span className="text-ink3 text-[12px]">
                  {t('currentPlan')}
                  {isTrial && activeTab !== 'free' ? t('trialSuffix') : ''}
                  {isCanceled && activeTab !== 'free' ? t('canceledSuffix') : ''}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-ink text-[22px] font-black">{price}</span>
              {priceUnit && <span className="text-ink3 ml-1 text-[13px]">{priceUnit}</span>}
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

        {/* 현재 구독 정보 — 유료 플랜일 때만 */}
        {isPaid && isCurrentPlan && (
          <div className="border-border rounded-2xl border bg-white p-5">
            <p className="text-ink mb-3 text-[14px] font-semibold">{t('info')}</p>

            <div className="space-y-3">
              {/* 구독 주기 */}
              <div className="flex items-center justify-between">
                <span className="text-ink3 text-[13px]">{t('cycle')}</span>
                <span className="text-ink text-[13px] font-medium">{periodLabel}</span>
              </div>

              {/* 갱신일 / 만료일 */}
              {expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-ink3 text-[13px]">
                    {isCanceled ? t('expiresOn') : t('renewsOn')}
                  </span>
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: isCanceled ? 'var(--color-error)' : 'var(--color-ink)' }}
                  >
                    {formatDate(expiresAt)}
                  </span>
                </div>
              )}

              {/* 취소일 */}
              {isCanceled && canceledAt && (
                <div className="flex items-center justify-between">
                  <span className="text-ink3 text-[13px]">{t('canceledOn')}</span>
                  <span className="text-ink2 text-[13px]">{formatDate(canceledAt)}</span>
                </div>
              )}

              {/* 등록 카드 */}
              {cardCompany && cardNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-ink3 text-[13px]">{t('payCard')}</span>
                  <span className="text-ink text-[13px] font-medium">
                    {cardCompany} ****{cardNumber.slice(-4)}
                  </span>
                </div>
              )}
            </div>

            {/* 취소 버튼 */}
            {!isCanceled && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-ink3 mt-4 w-full text-center text-[13px] underline underline-offset-2"
              >
                {t('cancel')}
              </button>
            )}

            {/* 취소 안내 */}
            {isCanceled && (
              <div className="bg-error-light mt-4 rounded-xl p-3">
                <p className="text-error text-[13px] leading-relaxed">
                  {t('canceledNotice', { date: formatDate(expiresAt) ?? '' })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 결제 내역 */}
        {payments.length > 0 && (
          <div className="border-border rounded-2xl border bg-white p-5">
            <p className="text-ink mb-3 text-[14px] font-semibold">{t('history')}</p>
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-ink text-[13px] font-medium">
                      {p.plan === 'pro' ? 'Pro' : 'Plus'}{' '}
                      {p.period === 'yearly' ? t('billingYearly') : t('billingMonthly')}
                    </p>
                    <p className="text-ink3 mt-0.5 text-[12px]">{formatDate(p.approved_at)}</p>
                  </div>
                  <span className="text-ink text-[13px] font-bold">{formatAmount(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 구독 취소 확인 바텀시트 */}
      {showCancelConfirm && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={() => setShowCancelConfirm(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[70] rounded-t-2xl bg-white p-6">
            <div className="mb-5 text-center">
              <p className="text-ink text-[17px] font-bold">{t('cancelConfirm')}</p>
              {expiresAt && (
                <p className="text-ink3 mt-2 text-[14px] leading-relaxed">
                  {t('cancelConfirmDesc', { date: formatDate(expiresAt) ?? '' })}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowCancelConfirm(false)}
                disabled={isPending}
                className="flex-1"
              >
                {t('goBack')}
              </Button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1 rounded-xl py-3 text-[15px] font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-error)' }}
              >
                {isPending ? t('canceling') : t('cancel')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, startTransition } from 'react'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'

interface Props {
  plan: 'pro' | 'plus'
  period: 'monthly' | 'yearly'
  userId: string
  locale: string
}

const PRICES: Record<string, Record<string, number>> = {
  pro: { monthly: 3900, yearly: 29900 },
  plus: { monthly: 6900, yearly: 59900 },
}

const PLAN_LABEL: Record<string, string> = { pro: 'Pro', plus: 'Plus' }

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TossPayments?: (clientKey: string) => any
  }
}

export default function PaymentClient({ plan, period: initialPeriod, userId, locale }: Props) {
  const t = useTranslations('mypage.subscription')
  const [period, setPeriod] = useState(initialPeriod)
  const [loading, setLoading] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const tossRef = useRef<ReturnType<NonNullable<typeof window.TossPayments>> | null>(null)

  const amount = PRICES[plan][period]

  const initToss = () => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    if (!clientKey || !window.TossPayments) return
    tossRef.current = window.TossPayments(clientKey)
    startTransition(() => setSdkReady(true))
  }

  useEffect(() => {
    // 이미 로드된 경우
    if (window.TossPayments) initToss()
  }, [])

  const handlePayment = async () => {
    if (!tossRef.current) {
      alert(t('widgetNotReady'))
      return
    }

    setLoading(true)
    try {
      const successUrl = `${window.location.origin}/${locale}/payment/success?plan=${plan}&period=${period}`
      const failUrl = `${window.location.origin}/${locale}/payment/fail`

      await tossRef.current.requestBillingAuth(t('card'), {
        customerKey: userId,
        successUrl,
        failUrl,
      })
    } catch {
      setLoading(false)
    }
  }

  return (
    <>
      <Script src="https://js.tosspayments.com/v1" strategy="afterInteractive" onReady={initToss} />

      <div className="flex flex-1 flex-col">
        {/* 플랜 정보 */}
        <div
          className="mx-4 mt-4 rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg,var(--color-hero-top),var(--color-primary))',
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-bold text-white">
              {PLAN_LABEL[plan]}
            </span>
            <span className="text-[12px] text-white/60">{t('plan')}</span>
          </div>
          <p className="text-[28px] font-black text-white">
            ₩{amount.toLocaleString()}
            <span className="ml-1 text-[14px] font-medium text-white/60">
              / {period === 'yearly' ? t('year') : t('month')}
            </span>
          </p>
          {period === 'yearly' && (
            <p className="mt-1 text-[13px] text-white/70">
              {t('monthlyEquiv', { amount: Math.round(amount / 12).toLocaleString() })} ·{' '}
              {t('saveAmount', {
                amount: (PRICES[plan].monthly - Math.round(amount / 12)).toLocaleString(),
              })}
            </p>
          )}
        </div>

        {/* 결제 주기 선택 */}
        <div className="mx-4 mt-4">
          <p className="text-ink3 mb-2 text-[12px] font-semibold tracking-wide uppercase">
            {t('billingCycle')}
          </p>
          <div className="flex gap-2">
            {(['monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="relative flex-1 rounded-xl border-[1.5px] py-3 text-[14px] font-semibold transition-all"
                style={{
                  borderColor: period === p ? 'var(--color-primary)' : 'var(--color-border)',
                  color: period === p ? 'var(--color-primary)' : 'var(--color-ink2)',
                  backgroundColor: period === p ? 'var(--color-primary-light)' : 'white',
                }}
              >
                {p === 'monthly' ? t('billingMonthly') : t('billingYearly')}
                {p === 'yearly' && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: 'var(--color-success)' }}
                  >
                    {t('discount', { percent: plan === 'pro' ? '36%' : '28%' })}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 혜택 목록 */}
        <div className="border-border mx-4 mt-4 rounded-2xl border bg-white p-4">
          <p className="text-ink mb-3 text-[13px] font-semibold">
            {t('planBenefits', { plan: PLAN_LABEL[plan] })}
          </p>
          <ul className="space-y-2">
            {(t.raw(`benefits.${plan}`) as string[]).map((f) => (
              <li key={f} className="text-ink2 flex items-center gap-2 text-[13px]">
                <span className="text-primary">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1" />

        <p className="text-ink3 mx-4 mt-4 text-center text-[12px] leading-relaxed">
          {t('withdrawalNotice')}
          <br />
          {t('cancelAnytime')}
          <br />
          {t('cardSafe')}
        </p>

        <div className="mx-4 mt-4 mb-8">
          <Button onClick={handlePayment} disabled={loading || !sdkReady} fullWidth>
            {loading
              ? t('redirecting')
              : !sdkReady
                ? t('loadingWidget')
                : t('payNow', { amount: amount.toLocaleString() })}
          </Button>
        </div>
      </div>
    </>
  )
}

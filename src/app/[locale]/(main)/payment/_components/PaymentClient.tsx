'use client'

import { useState, useEffect, useRef, startTransition } from 'react'
import Script from 'next/script'

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
const PLAN_FEATURES: Record<string, string[]> = {
  pro: [
    '여행 무제한',
    '메이트 최대 10명',
    'AI 추천 월 20회',
    '백로그 폴더/태그 정리',
    '팀 권한 관리',
    '광고 없음',
  ],
  plus: [
    '여행 무제한',
    '메이트 무제한',
    'AI 추천 무제한',
    '백로그 폴더/태그 정리',
    '팀 권한 관리',
    '공유 백로그',
    '광고 없음',
  ],
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TossPayments?: (clientKey: string) => any
  }
}

export default function PaymentClient({ plan, period: initialPeriod, userId, locale }: Props) {
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
      alert('결제 모듈 초기화 중이에요. 잠시 후 다시 시도해주세요.')
      return
    }

    setLoading(true)
    try {
      const successUrl = `${window.location.origin}/${locale}/payment/success?plan=${plan}&period=${period}`
      const failUrl = `${window.location.origin}/${locale}/payment/fail`

      await tossRef.current.requestBillingAuth('카드', {
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
          style={{ background: 'linear-gradient(135deg,#070E1A,#1B6FF0)' }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-bold text-white">
              {PLAN_LABEL[plan]}
            </span>
            <span className="text-[12px] text-white/60">플랜</span>
          </div>
          <p className="text-[28px] font-black text-white">
            ₩{amount.toLocaleString()}
            <span className="ml-1 text-[14px] font-medium text-white/60">
              / {period === 'yearly' ? '년' : '월'}
            </span>
          </p>
          {period === 'yearly' && (
            <p className="mt-1 text-[13px] text-white/70">
              월 환산 ₩{Math.round(amount / 12).toLocaleString()} · 월{' '}
              {(PRICES[plan].monthly - Math.round(amount / 12)).toLocaleString()}원 절약
            </p>
          )}
        </div>

        {/* 결제 주기 선택 */}
        <div className="mx-4 mt-4">
          <p className="mb-2 text-[12px] font-semibold tracking-wide text-[#9099A8] uppercase">
            결제 주기
          </p>
          <div className="flex gap-2">
            {(['monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="relative flex-1 rounded-xl border-[1.5px] py-3 text-[14px] font-semibold transition-all"
                style={{
                  borderColor: period === p ? '#1B6FF0' : '#E8EAED',
                  color: period === p ? '#1B6FF0' : '#515966',
                  backgroundColor: period === p ? '#EBF2FF' : 'white',
                }}
              >
                {p === 'monthly' ? '월간' : '연간'}
                {p === 'yearly' && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: '#12B76A' }}
                  >
                    {plan === 'pro' ? '36%' : '28%'} 할인
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 혜택 목록 */}
        <div className="mx-4 mt-4 rounded-2xl border border-[#E8EAED] bg-white p-4">
          <p className="mb-3 text-[13px] font-semibold text-[#0F1117]">
            {PLAN_LABEL[plan]} 플랜 혜택
          </p>
          <ul className="space-y-2">
            {PLAN_FEATURES[plan].map((f) => (
              <li key={f} className="flex items-center gap-2 text-[13px] text-[#5A6270]">
                <span className="text-[#1B6FF0]">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1" />

        <p className="mx-4 mt-4 text-center text-[12px] leading-relaxed text-[#9099A8]">
          구독은 만료일 전 언제든 취소 가능해요.
          <br />
          카드 정보는 토스페이먼츠에서 안전하게 관리돼요.
        </p>

        <div className="mx-4 mt-4 mb-8">
          <button
            onClick={handlePayment}
            disabled={loading || !sdkReady}
            className="h-[54px] w-full rounded-2xl text-[16px] font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: '#1B6FF0' }}
          >
            {loading
              ? '이동 중...'
              : !sdkReady
                ? '로딩 중...'
                : `₩${amount.toLocaleString()} 결제하기`}
          </button>
        </div>
      </div>
    </>
  )
}

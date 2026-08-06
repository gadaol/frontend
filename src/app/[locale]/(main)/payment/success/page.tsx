import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { issueBillingKey, chargeBilling, PLAN_PRICE, planOrderName } from '@/lib/toss'
import type { Database } from '@/types/database/database.types'

interface Props {
  searchParams: Promise<{
    authKey?: string
    customerKey?: string
    plan?: string
    period?: string
  }>
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { authKey, customerKey, plan, period } = await searchParams
  const locale = await getLocale()

  if (!authKey || !customerKey || !plan || (plan !== 'pro' && plan !== 'plus')) {
    redirect(`/${locale}/payment/fail?message=잘못된 접근이에요`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== customerKey) {
    redirect(`/${locale}/payment/fail?message=인증 오류가 발생했어요`)
  }

  const validPeriod = period === 'yearly' ? 'yearly' : 'monthly'
  const amount = PLAN_PRICE[plan][validPeriod]
  const orderId = crypto.randomUUID()
  const orderName = planOrderName(plan, validPeriod)

  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    // 1. 빌링키 발급
    const { billingKey, card } = await issueBillingKey(authKey, customerKey)

    // 2. 첫 결제
    const payment = await chargeBilling(billingKey, {
      customerKey,
      amount,
      orderId,
      orderName,
    })

    // 3. 빌링키 저장
    await adminSupabase.from('billing_keys').upsert({
      user_id: user.id,
      billing_key: billingKey,
      customer_key: customerKey,
      card_company: card.company,
      card_number: card.number,
    })

    // 4. 결제 내역 기록
    await adminSupabase.from('payments').insert({
      user_id: user.id,
      order_id: orderId,
      plan,
      period: validPeriod,
      amount,
      status: 'done',
      payment_key: payment.paymentKey,
      approved_at: payment.approvedAt,
    })

    // 5. 구독 업데이트
    const expiresAt = new Date()
    if (validPeriod === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    await adminSupabase.from('subscriptions').upsert({
      user_id: user.id,
      plan,
      status: 'active',
      expires_at: expiresAt.toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '결제 처리 중 오류가 발생했어요'
    redirect(`/${locale}/payment/fail?message=${encodeURIComponent(msg)}`)
  }

  redirect(`/${locale}/mypage?subscribed=1`)
}

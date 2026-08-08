import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { chargeBilling, planOrderName, PLAN_PRICE } from '@/lib/toss'
import type { Database } from '@/types/database/database.types'

// Vercel Cron이 매일 자정(UTC) 호출
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Vercel Cron secret 검증
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = new Date()
  // 오늘 만료되거나 이미 만료된 활성 구독 조회 (최대 1일 여유)
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() + 1)

  const { data: dueSubs, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan, period, expires_at')
    .eq('status', 'active')
    .lte('expires_at', cutoff.toISOString())

  if (error) {
    console.error('[cron] subscriptions fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = await Promise.allSettled(
    (dueSubs ?? []).map(async (sub) => {
      // 취소됐거나 이미 갱신된 경우 skip
      const { data: billingKey } = await supabase
        .from('billing_keys')
        .select('billing_key, customer_key')
        .eq('user_id', sub.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!billingKey) {
        // 빌링키 없으면 만료 처리
        await supabase.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id)
        return { subId: sub.id, result: 'expired_no_billing_key' }
      }

      const plan = sub.plan as 'pro' | 'plus'
      const period = (sub.period ?? 'monthly') as 'monthly' | 'yearly'
      const amount = PLAN_PRICE[plan][period]
      const orderId = crypto.randomUUID()

      try {
        const payment = await chargeBilling(billingKey.billing_key, {
          customerKey: billingKey.customer_key,
          amount,
          orderId,
          orderName: planOrderName(plan, period),
        })

        // 결제 내역 기록
        await supabase.from('payments').insert({
          user_id: sub.user_id,
          order_id: orderId,
          plan,
          period,
          amount,
          status: 'done',
          payment_key: payment.paymentKey,
          approved_at: payment.approvedAt,
        })

        // 구독 갱신
        const newExpiry = new Date(sub.expires_at ?? now)
        if (period === 'yearly') {
          newExpiry.setFullYear(newExpiry.getFullYear() + 1)
        } else {
          newExpiry.setMonth(newExpiry.getMonth() + 1)
        }

        await supabase
          .from('subscriptions')
          .update({ status: 'active', expires_at: newExpiry.toISOString(), canceled_at: null })
          .eq('id', sub.id)

        return { subId: sub.id, result: 'renewed' }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'charge_failed'
        console.error(`[cron] charge failed for sub ${sub.id}:`, msg)

        // 결제 실패 → 만료 처리
        await supabase.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id)

        return { subId: sub.id, result: 'expired_charge_failed', error: msg }
      }
    }),
  )

  const summary = results.map((r) => (r.status === 'fulfilled' ? r.value : { error: r.reason }))
  console.log('[cron] renew-subscriptions done:', summary)

  return NextResponse.json({ processed: summary.length, summary })
}

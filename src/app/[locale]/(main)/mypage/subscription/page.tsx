import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import SubscriptionClient from './_components/SubscriptionClient'
import type { Plan } from '@/utils/plans'

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const [{ data: subscriptionRow }, { data: billingKey }, { data: payments }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('id, plan, status, period, expires_at, canceled_at')
      .eq('user_id', user.id)
      .in('status', ['active', 'trial', 'canceled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('billing_keys')
      .select('card_company, card_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('payments')
      .select('id, plan, period, amount, status, approved_at')
      .eq('user_id', user.id)
      .order('approved_at', { ascending: false })
      .limit(10),
  ])

  const plan = (subscriptionRow?.plan as Plan | undefined) ?? 'free'
  const isTrial = subscriptionRow?.status === 'trial'
  const isCanceled = subscriptionRow?.status === 'canceled'

  return (
    <SubscriptionClient
      plan={plan}
      isTrial={isTrial}
      isCanceled={isCanceled}
      period={(subscriptionRow?.period as 'monthly' | 'yearly' | undefined) ?? 'monthly'}
      expiresAt={subscriptionRow?.expires_at ?? null}
      canceledAt={subscriptionRow?.canceled_at ?? null}
      cardCompany={billingKey?.card_company ?? null}
      cardNumber={billingKey?.card_number ?? null}
      payments={payments ?? []}
    />
  )
}

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

  const { data: subscriptionRow } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const plan = (subscriptionRow?.plan as Plan | undefined) ?? 'free'
  const isTrial = subscriptionRow?.status === 'trial'

  return <SubscriptionClient plan={plan} isTrial={isTrial} />
}

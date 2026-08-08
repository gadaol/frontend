import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import PaymentClient from './_components/PaymentClient'

interface Props {
  searchParams: Promise<{ plan?: string; period?: string }>
}

export default async function PaymentPage({ searchParams }: Props) {
  const { plan, period } = await searchParams
  const locale = await getLocale()
  const t = await getTranslations('mypage')

  if (plan !== 'pro' && plan !== 'plus') redirect(`/${locale}/mypage`)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}`)

  const validPeriod: 'monthly' | 'yearly' = period === 'yearly' ? 'yearly' : 'monthly'

  return (
    <div className="bg-bg2 flex min-h-dvh flex-col">
      <AppHeader title={t('payTitle')} onBack="router" />
      <PaymentClient plan={plan} period={validPeriod} userId={user.id} locale={locale} />
    </div>
  )
}

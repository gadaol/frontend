import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import MypageClient from './_components/MypageClient'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const locale = await getLocale()
  if (!user) redirect(`/${locale}`)

  const provider = (user.app_metadata?.provider ?? 'email') as string

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [
    { data: profile },
    { data: subscriptionRow },
    { data: links },
    { count: tripCount },
    { count: placeCount },
  ] = await Promise.all([
    supabase.from('profiles').select('name, phone, avatar_url').eq('id', user.id).single(),
    supabase
      .from('subscriptions')
      .select('plan, status, expires_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminClient.from('account_links').select('linked_provider').eq('primary_user_id', user.id),
    supabase
      .from('trip_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('backlog_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const linkedSet = new Set<string>((links ?? []).map((l) => l.linked_provider as string))
  linkedSet.add(provider)

  const displayName = profile?.name ?? user.email?.split('@')[0] ?? ''
  const email = user.email ?? ''
  const initials = displayName.trim() ? displayName.trim()[0].toUpperCase() : '?'
  const avatarUrl = profile?.avatar_url ?? null

  return (
    <MypageClient
      displayName={displayName}
      email={email}
      initials={initials}
      avatarUrl={avatarUrl}
      linkedProviders={[...linkedSet]}
      currentProvider={provider}
      subscription={
        subscriptionRow
          ? { ...subscriptionRow, plan: subscriptionRow.plan as 'free' | 'pro' | 'team' }
          : null
      }
      tripCount={tripCount ?? 0}
      placeCount={placeCount ?? 0}
    />
  )
}

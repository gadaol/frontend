import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import ProfileSettingsClient from './_components/ProfileSettingsClient'

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const provider = (user.app_metadata?.provider ?? 'email') as string

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const [{ data: profile }, { data: links }] = await Promise.all([
    supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single(),
    adminClient.from('account_links').select('linked_provider').eq('primary_user_id', user.id),
  ])

  const linkedSet = new Set<string>((links ?? []).map((l) => l.linked_provider as string))
  linkedSet.add(provider)

  const displayName = profile?.name ?? user.email?.split('@')[0] ?? ''
  const initials = displayName.trim() ? displayName.trim()[0].toUpperCase() : '?'

  return (
    <ProfileSettingsClient
      displayName={displayName}
      initials={initials}
      avatarUrl={profile?.avatar_url ?? null}
      linkedProviders={[...linkedSet]}
      currentProvider={provider}
    />
  )
}

import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import ProfileSettingsClient from './_components/ProfileSettingsClient'

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const provider = (user.app_metadata?.provider ?? 'email') as string

  // linkIdentity로 연동된 계정은 user.identities에 반영됨
  const linkedProviders = Array.from(new Set(user.identities?.map((i) => i.provider) ?? [provider]))

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .single()

  const displayName = profile?.name ?? user.email?.split('@')[0] ?? ''
  const initials = displayName.trim() ? displayName.trim()[0].toUpperCase() : '?'

  return (
    <ProfileSettingsClient
      displayName={displayName}
      initials={initials}
      avatarUrl={profile?.avatar_url ?? null}
      linkedProviders={linkedProviders}
      currentProvider={provider}
    />
  )
}

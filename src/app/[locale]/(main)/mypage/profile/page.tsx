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

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url, phone')
    .eq('id', user.id)
    .single()

  const displayName = profile?.name ?? user.email?.split('@')[0] ?? ''
  const initials = displayName.trim() ? displayName.trim()[0].toUpperCase() : '?'

  return (
    <ProfileSettingsClient
      displayName={displayName}
      initials={initials}
      avatarUrl={profile?.avatar_url ?? null}
      phone={profile?.phone ?? null}
      provider={provider}
    />
  )
}

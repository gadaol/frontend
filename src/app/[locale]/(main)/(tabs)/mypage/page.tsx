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

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, phone')
    .eq('id', user.id)
    .single()

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: links } = await adminClient
    .from('account_links')
    .select('linked_provider')
    .eq('primary_user_id', user.id)

  const linkedSet = new Set<string>((links ?? []).map((l) => l.linked_provider as string))
  linkedSet.add(provider)

  const displayName = profile?.name ?? user.email?.split('@')[0] ?? ''
  const email = user.email ?? ''
  const phone = profile?.phone ?? ''
  const initials = displayName.trim() ? displayName.trim()[0].toUpperCase() : '?'

  return (
    <MypageClient
      displayName={displayName}
      email={email}
      phone={phone}
      initials={initials}
      linkedProviders={[...linkedSet]}
      currentProvider={provider}
    />
  )
}

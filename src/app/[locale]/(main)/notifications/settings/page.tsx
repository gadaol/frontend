import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getNotificationPrefs } from '@/app/actions/notifications'
import NotificationSettingsClient from './_components/NotificationSettingsClient'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const locale = await getLocale()
  if (!user) redirect(`/${locale}`)

  const prefs = await getNotificationPrefs()

  return <NotificationSettingsClient prefs={prefs} />
}

import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import BacklogList from './_components/BacklogList'
import { getCollections } from '@/app/actions/collection'

export default async function BacklogPage() {
  const supabase = await createClient()
  const locale = await getLocale()
  const t = await getTranslations('backlog')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const [{ data }, collections] = await Promise.all([
    supabase
      .from('backlog_items')
      .select(
        'id, memo, collection_id, places(google_place_id, name, address, photo_ref, place_categories(name))',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    getCollections(),
  ])

  const items = (data ?? []) as Parameters<typeof BacklogList>[0]['items']

  return (
    <div className="bg-bg2 flex min-h-full flex-col">
      <AppHeader title={t('title')} border />
      <BacklogList items={items} collections={collections} />
    </div>
  )
}

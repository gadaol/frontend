import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import BacklogList from './_components/BacklogList'

export default async function BacklogPage() {
  const supabase = await createClient()
  const locale = await getLocale()
  const t = await getTranslations('backlog')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const { data } = await supabase
    .from('backlog_items')
    .select('id, memo, places(google_place_id, name, address, place_categories(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = (data ?? []) as Parameters<typeof BacklogList>[0]['items']

  return (
    <div className="bg-bg2 flex min-h-full flex-col">
      <AppHeader
        title={t('title')}
        border
        right={
          items.length > 0 ? (
            <span className="text-ink3 text-[13px] font-medium">
              {t('count', { count: items.length })}
            </span>
          ) : undefined
        }
      />
      <BacklogList items={items} />
    </div>
  )
}

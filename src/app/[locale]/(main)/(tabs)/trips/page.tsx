import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PlusIcon } from '@/components/icons'
import AppHeader from '@/components/common/AppHeader'
import TripTabs from './_components/TripTabs'
import type { TripWithMembers } from '@/types/trip'

export default async function TripsPage() {
  const supabase = await createClient()
  const locale = await getLocale()
  const t = await getTranslations('trips')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const { data } = await supabase
    .from('trips')
    .select('*, trip_members(user_id, role), trip_tags(tag)')
    .order('start_date', { ascending: true })

  const trips = (data ?? []) as TripWithMembers[]

  return (
    <div className="bg-bg2 flex min-h-full flex-col">
      <AppHeader
        title={t('title')}
        right={
          <Link
            href={`/${locale}/trips/new`}
            className="text-primary flex h-9 w-9 items-center justify-center"
            aria-label={t('newTitle')}
          >
            <PlusIcon size={24} />
          </Link>
        }
      />

      {trips.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-16">
          <p className="text-ink3 text-[14px]">{t('emptyAll')}</p>
          <Link
            href={`/${locale}/trips/new`}
            className="bg-primary rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            {t('newTitle')}
          </Link>
        </div>
      ) : (
        <TripTabs trips={trips} />
      )}
    </div>
  )
}

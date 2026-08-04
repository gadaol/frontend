import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { MapPinIcon, PlacesIcon } from '@/components/icons'
import AppHeader from '@/components/common/AppHeader'

type BacklogItem = {
  id: string
  memo: string | null
  trip_id: string | null
  places: {
    name: string
    address: string | null
    place_categories: { name: string } | null
  } | null
  trips: { title: string } | null
}

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
    .select('id, memo, trip_id, places(name, address, place_categories(name)), trips(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = (data ?? []) as BacklogItem[]

  return (
    <div className="bg-bg2 flex min-h-full flex-col">
      <AppHeader title={t('title')} border />

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
          <div className="bg-primary-light flex h-20 w-20 items-center justify-center rounded-[24px]">
            <MapPinIcon size={36} className="text-primary" />
          </div>
          <div>
            <p className="text-ink mb-1 text-[16px] font-semibold">{t('empty')}</p>
            <p className="text-ink3 text-[13px] leading-relaxed">{t('emptyDesc')}</p>
          </div>
          <Link
            href={`/${locale}/places`}
            className="bg-primary mt-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            {t('explore')}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4 py-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="border-border bg-bg flex items-start gap-3 rounded-2xl border px-4 py-4"
            >
              <div className="bg-primary-light mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px]">
                <MapPinIcon size={22} className="text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[15px] font-semibold">
                  {item.places?.name ?? '알 수 없는 장소'}
                </p>

                {item.places?.address && (
                  <p className="text-ink3 mt-0.5 truncate text-[12px]">{item.places.address}</p>
                )}

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {item.places?.place_categories?.name && (
                    <span className="bg-primary-light text-primary rounded-full px-2 py-0.5 text-[11px] font-medium">
                      {item.places.place_categories.name}
                    </span>
                  )}
                  {item.trips?.title && (
                    <span className="bg-bg2 text-ink3 rounded-full px-2 py-0.5 text-[11px]">
                      {item.trips.title}
                    </span>
                  )}
                </div>

                {item.memo && (
                  <p className="text-ink2 mt-2 text-[12px] leading-relaxed">
                    &ldquo;{item.memo}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

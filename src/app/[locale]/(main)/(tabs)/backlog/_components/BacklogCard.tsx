'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { getCategoryStyle } from '@/utils/placeCategory'
import PlacePhoto from '@/components/features/places/PlacePhoto'

type BacklogCardProps = {
  id: string
  googlePlaceId: string | null
  placeName: string
  address: string | null
  categoryName: string | null
  photoRef: string | null
  tripTitle: string | null
  memo: string | null
}

export default function BacklogCard({
  googlePlaceId,
  placeName,
  address,
  categoryName,
  photoRef,
  tripTitle,
  memo,
}: BacklogCardProps) {
  const locale = useLocale()
  const t = useTranslations('trips')
  const tp = useTranslations('places')
  const cat = getCategoryStyle(categoryName)

  const inner = (
    <div className="border-border bg-bg flex overflow-hidden rounded-2xl border active:opacity-80">
      {/* 카테고리 썸네일 */}
      <PlacePhoto
        photoRef={photoRef}
        categoryStyle={cat}
        iconSize={26}
        className="h-full w-[72px] flex-shrink-0"
      />

      {/* 바디 */}
      <div className="flex min-w-0 flex-1 flex-col justify-between px-3.5 py-3">
        <div>
          <p className="text-ink truncate text-[14px] leading-tight font-bold">{placeName}</p>
          {address && <p className="text-ink3 mt-0.5 truncate text-[11px]">{address}</p>}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold ${cat.color}`}
          >{`#${tp(cat.i18nKey as never)}`}</span>
          {tripTitle ? (
            <p className="text-ink3 ml-2 truncate text-[11px]">
              →{' '}
              {t.rich('addedToTrip', {
                trip: () => <span className="text-primary font-semibold">{tripTitle}</span>,
              })}
            </p>
          ) : memo ? (
            <p className="text-ink2 ml-2 max-w-[120px] truncate text-[11px] italic">
              &ldquo;{memo}&rdquo;
            </p>
          ) : (
            <p className="text-ink3 text-[11px]">{t('notAdded')}</p>
          )}
        </div>
      </div>
    </div>
  )

  if (googlePlaceId) {
    return <Link href={`/${locale}/places/${googlePlaceId}`}>{inner}</Link>
  }

  return inner
}

'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { getCategoryInfoByLabel } from '@/utils/placeCategory'

type BacklogCardProps = {
  id: string
  googlePlaceId: string | null
  placeName: string
  address: string | null
  categoryName: string | null
  tripTitle: string | null
  memo: string | null
}

export default function BacklogCard({
  googlePlaceId,
  placeName,
  address,
  categoryName,
  tripTitle,
  memo,
}: BacklogCardProps) {
  const locale = useLocale()
  const category = getCategoryInfoByLabel(categoryName ?? '')
  const Icon = category.icon

  const inner = (
    <div className="border-border bg-bg flex overflow-hidden rounded-2xl border active:opacity-80">
      {/* 썸네일 */}
      <div className={`flex w-20 flex-shrink-0 items-center justify-center ${category.bg}`}>
        <Icon size={28} className={category.color} />
      </div>

      {/* 바디 */}
      <div className="flex min-w-0 flex-1 flex-col justify-between px-3.5 py-3">
        <div>
          <span
            className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${category.bg} ${category.color}`}
          >
            {category.label}
          </span>
          <p className="text-ink truncate text-[14px] leading-tight font-bold">{placeName}</p>
          {address && <p className="text-ink3 mt-0.5 truncate text-[11px]">{address}</p>}
        </div>

        <div className="mt-2 flex items-center justify-between">
          {tripTitle ? (
            <p className="text-ink3 text-[11px]">
              → <span className="text-primary font-semibold">{tripTitle}</span>에 추가됨
            </p>
          ) : (
            <p className="text-ink3 text-[11px]">아직 여행에 미추가</p>
          )}
          {memo && (
            <p className="text-ink2 ml-2 max-w-[120px] truncate text-[11px] italic">
              &ldquo;{memo}&rdquo;
            </p>
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

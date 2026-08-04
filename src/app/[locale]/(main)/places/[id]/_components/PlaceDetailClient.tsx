'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronLeftIcon } from '@/components/icons'
import { getCategoryInfo } from '@/utils/placeCategory'
import { addToBacklog, removeFromBacklogByGooglePlaceId } from '@/app/actions/backlog'
import type { GooglePlaceDetail } from '../page'

interface Props {
  place: GooglePlaceDetail
  initialSaved?: boolean
}

const COVER_GRADIENTS: Record<string, string> = {
  restaurant: 'linear-gradient(135deg,#FFF0E6,#FFCBA4)',
  food: 'linear-gradient(135deg,#FFF0E6,#FFCBA4)',
  meal_takeaway: 'linear-gradient(135deg,#FFF0E6,#FFCBA4)',
  cafe: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
  bakery: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
  lodging: 'linear-gradient(135deg,#EBF1FE,#BFDBFE)',
  hotel: 'linear-gradient(135deg,#EBF1FE,#BFDBFE)',
  tourist_attraction: 'linear-gradient(135deg,#FEF9C3,#FDE047)',
  museum: 'linear-gradient(135deg,#FEF9C3,#FDE047)',
  amusement_park: 'linear-gradient(135deg,#FEF9C3,#FDE047)',
  shopping_mall: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)',
  store: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)',
  park: 'linear-gradient(135deg,#D1FAE5,#A7F3D0)',
  natural_feature: 'linear-gradient(135deg,#D1FAE5,#A7F3D0)',
  night_club: 'linear-gradient(135deg,#FCE7F3,#FBCFE8)',
  bar: 'linear-gradient(135deg,#FCE7F3,#FBCFE8)',
  subway_station: 'linear-gradient(135deg,#CFFAFE,#A5F3FC)',
  airport: 'linear-gradient(135deg,#CFFAFE,#A5F3FC)',
  hospital: 'linear-gradient(135deg,#FEE2E2,#FECACA)',
}

function getCoverGradient(types: string[]): string {
  for (const type of types) {
    if (COVER_GRADIENTS[type]) return COVER_GRADIENTS[type]
  }
  return 'linear-gradient(135deg,#EBF2FF,#C7D9FF)'
}

export default function PlaceDetailClient({ place, initialSaved = false }: Props) {
  const t = useTranslations('places')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(initialSaved)

  const category = getCategoryInfo(place.types)
  const Icon = category.icon
  const coverGradient = getCoverGradient(place.types)

  function handleSaveToggle() {
    startTransition(async () => {
      if (saved) {
        await removeFromBacklogByGooglePlaceId(place.id)
        setSaved(false)
      } else {
        await addToBacklog({
          googlePlaceId: place.id,
          name: place.displayName.text,
          address: place.formattedAddress,
          categoryName: place.types[0] ?? null,
        })
        setSaved(true)
      }
      router.refresh()
    })
  }

  return (
    <div className="bg-bg2 flex min-h-full flex-col">
      {/* 커버 */}
      <div className="relative h-60 flex-shrink-0" style={{ background: coverGradient }}>
        {/* 어두운 오버레이 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
          }}
        />

        {/* 상단 액션 버튼 */}
        <div className="absolute top-12 right-3 left-3 z-10 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm"
          >
            <ChevronLeftIcon size={20} className="text-white" />
          </button>
        </div>

        {/* 커버 하단: 카테고리 태그 + 이름 + 주소 */}
        <div className="absolute right-0 bottom-0 left-0 z-10 px-4 pb-4">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 backdrop-blur-sm">
            <Icon size={12} className="text-white" />
            <span className="text-[11px] font-semibold text-white">{category.label}</span>
          </div>
          <h1 className="mb-1 text-[22px] leading-tight font-bold tracking-tight text-white">
            {place.displayName.text}
          </h1>
          <p className="text-[13px] text-white/70">{place.formattedAddress}</p>
        </div>
      </div>

      {/* 메타 행: 있는 데이터만 표시 */}
      {(place.rating || place.userRatingCount || place.internationalPhoneNumber) && (
        <div className="border-border bg-bg flex flex-shrink-0 border-b">
          {place.rating != null && (
            <div
              className={`border-border flex flex-1 flex-col items-center gap-0.5 py-3.5 ${place.userRatingCount || place.internationalPhoneNumber ? 'border-r' : ''}`}
            >
              <span className="text-ink text-[16px] font-bold">⭐ {place.rating.toFixed(1)}</span>
              <span className="text-ink3 text-[11px]">{t('rating')}</span>
            </div>
          )}
          {place.userRatingCount != null && (
            <div
              className={`border-border flex flex-1 flex-col items-center gap-0.5 py-3.5 ${place.internationalPhoneNumber ? 'border-r' : ''}`}
            >
              <span className="text-ink text-[16px] font-bold">
                {place.userRatingCount.toLocaleString()}
              </span>
              <span className="text-ink3 text-[11px]">{t('reviewCount')}</span>
            </div>
          )}
          {place.internationalPhoneNumber && (
            <div className="flex flex-1 flex-col items-center gap-0.5 py-3.5">
              <a
                href={`tel:${place.internationalPhoneNumber}`}
                className="text-primary text-[16px] font-bold"
              >
                {t('call')}
              </a>
              <span className="text-ink3 text-[11px]">{t('phone')}</span>
            </div>
          )}
        </div>
      )}

      {/* 스크롤 컨텐츠 */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* 운영시간 */}
        {place.regularOpeningHours?.weekdayDescriptions && (
          <div className="bg-bg mt-2 px-4 py-4">
            <p className="text-ink mb-3 text-[15px] font-semibold">{t('hours')}</p>
            <div className="flex flex-col divide-y divide-[#F0F1F3]">
              {place.regularOpeningHours.weekdayDescriptions.map((desc, i) => {
                const [day, ...rest] = desc.split(': ')
                return (
                  <div key={i} className="flex items-start justify-between py-2">
                    <span className="text-ink2 w-24 flex-shrink-0 text-[13px]">{day}</span>
                    <span className="text-ink text-right text-[13px]">
                      {rest.join(': ') || '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 웹사이트 */}
        {place.websiteUri && (
          <div className="bg-bg mt-2 px-4 py-4">
            <p className="text-ink mb-2 text-[15px] font-semibold">{t('website')}</p>
            <a
              href={place.websiteUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary truncate text-[13px]"
            >
              {place.websiteUri.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          </div>
        )}

        {/* 리뷰 */}
        {place.reviews &&
          place.reviews.length > 0 &&
          (() => {
            const COLORS = ['#1B6FF0', '#515966', '#059669', '#D97706', '#7C3AED', '#DB2777']
            return (
              <div className="bg-bg mt-2 px-4 py-4">
                <p className="text-ink mb-3 text-[15px] font-semibold">
                  {t('reviewsTitle')} (
                  {place.userRatingCount?.toLocaleString() ?? place.reviews.length})
                </p>
                <div className="flex flex-col divide-y divide-[#F0F1F3]">
                  {place.reviews.map((review, i) => (
                    <div key={i} className="flex gap-3 py-3">
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                        style={{ background: COLORS[i % COLORS.length] }}
                      >
                        {review.authorAttribution.displayName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-ink text-[13px] font-semibold">
                            {review.authorAttribution.displayName}
                          </p>
                          <p className="text-ink3 text-[11px]">
                            {review.relativePublishTimeDescription}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[12px] text-yellow-500">
                          {'★'.repeat(review.rating)}
                          {'☆'.repeat(5 - review.rating)}
                        </p>
                        {review.text?.text && (
                          <p className="text-ink2 mt-1 text-[13px] leading-relaxed">
                            {review.text.text}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
      </div>

      {/* 하단 고정 바 */}
      <div
        className="border-border bg-bg fixed right-0 bottom-0 left-0 flex gap-2.5 border-t px-4 py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleSaveToggle}
          disabled={isPending}
          className={`flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border text-[15px] font-medium disabled:opacity-50 ${
            saved ? 'border-primary text-primary bg-white' : 'border-border text-ink bg-white'
          }`}
        >
          {saved ? t('savedToBacklog') : t('saveToBacklog')}
        </button>
        <button className="bg-primary flex h-12 flex-[2] items-center justify-center gap-1.5 rounded-xl text-[15px] font-medium text-white">
          {t('addToTrip')}
        </button>
      </div>
    </div>
  )
}

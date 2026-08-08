'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeftIcon } from '@/components/icons'
import Button from '@/components/ui/Button'
import { getCategoryInfo, getDbCategory } from '@/utils/placeCategory'
import {
  addToBacklog,
  removeFromBacklogByGooglePlaceId,
  getOrCreatePlace,
} from '@/app/actions/backlog'
import { addCandidatePlace } from '@/app/actions/candidate'
import { addItineraryItem } from '@/app/actions/trip'
import { getUpcomingTrips, type UpcomingTrip } from '@/app/actions/destinations'
import type { GooglePlaceDetail } from '../page'

interface Props {
  place: GooglePlaceDetail
  initialSaved?: boolean
}

const COVER_GRADIENTS: Record<string, string> = {
  restaurant: 'linear-gradient(135deg,#FFF0E6,#FFCBA4)',
  food: 'linear-gradient(135deg,#FFF0E6,#FFCBA4)',
  meal_takeaway: 'linear-gradient(135deg,#FFF0E6,#FFCBA4)',
  cafe: 'linear-gradient(135deg,var(--color-warning-light),#FDE68A)',
  bakery: 'linear-gradient(135deg,var(--color-warning-light),#FDE68A)',
  lodging: 'linear-gradient(135deg,#EBF1FE,#BFDBFE)',
  hotel: 'linear-gradient(135deg,#EBF1FE,#BFDBFE)',
  tourist_attraction: 'linear-gradient(135deg,#FEF9C3,#FDE047)',
  museum: 'linear-gradient(135deg,#FEF9C3,#FDE047)',
  amusement_park: 'linear-gradient(135deg,#FEF9C3,#FDE047)',
  shopping_mall: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)',
  store: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)',
  park: 'linear-gradient(135deg,var(--color-success-light),#A7F3D0)',
  natural_feature: 'linear-gradient(135deg,var(--color-success-light),#A7F3D0)',
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
  return 'linear-gradient(135deg,var(--color-primary-light),#C7D9FF)'
}

type DayStatus = 'idle' | 'saving' | 'saved'

function computeDays(startDate: string, endDate: string) {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const days: Array<{ dayNumber: number; date: string }> = []
  const cur = new Date(start)
  let n = 1
  while (cur <= end && n <= 30) {
    days.push({ dayNumber: n, date: cur.toISOString().split('T')[0] })
    cur.setDate(cur.getDate() + 1)
    n++
  }
  return days
}

export default function PlaceDetailClient({ place, initialSaved = false }: Props) {
  const tp = useTranslations('places')
  const t = useTranslations('places')
  const router = useRouter()
  const locale = useLocale()
  const isKo = locale === 'ko'
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(initialSaved)

  const [showTripPicker, setShowTripPicker] = useState(false)
  const [trips, setTrips] = useState<UpcomingTrip[]>([])
  const [tripsLoading, setTripsLoading] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [tripStatusMap, setTripStatusMap] = useState<Record<string, Record<string, DayStatus>>>({})

  const category = getCategoryInfo(place.types)
  const Icon = category.icon
  const coverGradient = getCoverGradient(place.types)
  const coverPhotoRef = place.photos?.[0]?.name ?? null

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
          photoRef: coverPhotoRef,
        })
        setSaved(true)
      }
      router.refresh()
    })
  }

  async function openTripPicker() {
    setShowTripPicker(true)
    setSelectedTripId(null)
    if (trips.length === 0) {
      setTripsLoading(true)
      const result = await getUpcomingTrips()
      setTrips(result)
      setTripsLoading(false)
    }
  }

  async function handleAddToTrip(trip: UpcomingTrip, dayKey: 'candidate' | string) {
    const current = tripStatusMap[trip.id]?.[dayKey] ?? 'idle'
    if (current !== 'idle') return

    setTripStatusMap((prev) => ({
      ...prev,
      [trip.id]: { ...(prev[trip.id] ?? {}), [dayKey]: 'saving' },
    }))

    try {
      if (dayKey === 'candidate') {
        await addCandidatePlace(
          trip.id,
          place.id,
          place.displayName.text,
          place.formattedAddress,
          getDbCategory(place.types ?? []),
          null,
          null,
        )
      } else {
        const dayNumber = parseInt(dayKey)
        const days = computeDays(trip.start_date!, trip.end_date!)
        const day = days.find((d) => d.dayNumber === dayNumber)
        if (day) {
          const placeId = await getOrCreatePlace({
            googlePlaceId: place.id,
            name: place.displayName.text,
            address: place.formattedAddress,
            categoryName: getDbCategory(place.types ?? []),
            lat: null,
            lng: null,
            photoRef: coverPhotoRef,
          })
          if (placeId) await addItineraryItem(trip.id, day.date, day.dayNumber, placeId)
        }
      }
    } catch {}

    setTripStatusMap((prev) => ({
      ...prev,
      [trip.id]: { ...(prev[trip.id] ?? {}), [dayKey]: 'saved' },
    }))

    setTimeout(() => router.push(`/${locale}/trips/${trip.id}`), 600)
  }

  return (
    <div className="bg-bg2 flex min-h-full flex-col">
      {/* 커버 */}
      <div
        className="relative h-60 flex-shrink-0"
        style={coverPhotoRef ? undefined : { background: coverGradient }}
      >
        {coverPhotoRef && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/places/photo?ref=${encodeURIComponent(coverPhotoRef)}`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: coverPhotoRef
              ? 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)'
              : 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
          }}
        />

        <div className="absolute top-12 right-3 left-3 z-10 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm"
          >
            <ChevronLeftIcon size={20} className="text-white" />
          </button>
        </div>

        <div className="absolute right-0 bottom-0 left-0 z-10 px-4 pb-4">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 backdrop-blur-sm">
            <Icon size={12} className="text-white" />
            <span className="text-[11px] font-semibold text-white">{`#${tp(category.i18nKey as never)}`}</span>
          </div>
          <h1 className="mb-1 text-[22px] leading-tight font-bold tracking-tight text-white">
            {place.displayName.text}
          </h1>
          <p className="text-[13px] text-white/70">{place.formattedAddress}</p>
        </div>
      </div>

      {/* 메타 행 */}
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
        {place.regularOpeningHours?.weekdayDescriptions && (
          <div className="bg-bg mt-2 px-4 py-4">
            <p className="text-ink mb-3 text-[15px] font-semibold">{t('hours')}</p>
            <div className="divide-border flex flex-col divide-y">
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

        {place.reviews &&
          place.reviews.length > 0 &&
          (() => {
            const COLORS = [
              'var(--color-primary)',
              'var(--color-ink2)',
              '#059669',
              '#D97706',
              '#7C3AED',
              '#DB2777',
            ]
            return (
              <div className="bg-bg mt-2 px-4 py-4">
                <p className="text-ink mb-3 text-[15px] font-semibold">
                  {t('reviewsTitle')} (
                  {place.userRatingCount?.toLocaleString() ?? place.reviews.length})
                </p>
                <div className="divide-border flex flex-col divide-y">
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
        <Button className="flex-[2]" onClick={openTripPicker}>
          {t('addToTrip')}
        </Button>
      </div>

      {/* 여행 선택 바텀시트 */}
      {showTripPicker && (
        <>
          <div
            className="fixed inset-0 z-[70] bg-black/40"
            onClick={() => {
              setShowTripPicker(false)
              setSelectedTripId(null)
            }}
          />
          <div className="fixed inset-x-0 bottom-0 z-[71] flex max-h-[75dvh] flex-col rounded-t-3xl bg-white">
            <div className="flex flex-shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-gray-200" />
            </div>
            <div className="flex flex-shrink-0 items-center justify-between px-5 pt-1 pb-3">
              <p className="text-ink text-[16px] font-bold">
                {isKo ? '어느 여행에 추가할까요?' : 'Add to which trip?'}
              </p>
              <button
                onClick={() => {
                  setShowTripPicker(false)
                  setSelectedTripId(null)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="#666"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="bg-border h-px flex-shrink-0" />

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {/* 새 여행 만들기 */}
              <button
                onClick={() => router.push(`/${locale}/trips/new`)}
                className="border-primary/20 bg-primary/5 active:bg-primary/10 mb-3 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors"
              >
                <div className="bg-primary/15 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M5 2v6M2 5h6"
                      stroke="var(--color-primary)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="text-primary text-[13px] font-semibold">
                  {isKo ? '새 여행 만들기' : 'Create new trip'}
                </span>
              </button>

              {tripsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
                </div>
              ) : trips.length === 0 ? (
                <p className="text-ink3 py-4 text-center text-[13px]">
                  {isKo ? '진행 중인 여행이 없어요.' : 'No active trips.'}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {trips.map((trip) => {
                    const isExpanded = selectedTripId === trip.id
                    const days =
                      trip.start_date && trip.end_date
                        ? computeDays(trip.start_date, trip.end_date)
                        : []

                    return (
                      <div
                        key={trip.id}
                        className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                      >
                        <button
                          onClick={() => setSelectedTripId(isExpanded ? null : trip.id)}
                          className="flex w-full items-center justify-between px-3 py-3 text-left active:bg-gray-50"
                        >
                          <div className="min-w-0">
                            <p className="text-ink truncate text-[14px] font-semibold">
                              {trip.title}
                            </p>
                            {trip.destination && (
                              <p className="text-ink3 text-[12px]">{trip.destination}</p>
                            )}
                          </div>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            className={`ml-2 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          >
                            <path
                              d="M3 5l4 4 4-4"
                              stroke="#aaa"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        {isExpanded && (
                          <div className="border-border border-t px-3 pt-2 pb-3">
                            {/* 후보에 추가 */}
                            {(() => {
                              const s = tripStatusMap[trip.id]?.['candidate'] ?? 'idle'
                              return (
                                <button
                                  onClick={() => handleAddToTrip(trip, 'candidate')}
                                  disabled={s !== 'idle'}
                                  className={`mb-1.5 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                                    s === 'saved' ? 'bg-primary/8' : 'bg-gray-50 active:bg-gray-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
                                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                                        <path
                                          d="M4.5 1.5v6M1.5 4.5h6"
                                          stroke="#888"
                                          strokeWidth="1.3"
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                    </div>
                                    <span
                                      className={`text-[13px] font-semibold ${s === 'saved' ? 'text-primary' : 'text-ink2'}`}
                                    >
                                      {isKo ? '후보에 추가' : 'Add as candidate'}
                                    </span>
                                  </div>
                                  {s === 'saving' ? (
                                    <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                  ) : s === 'saved' ? (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                      <path
                                        d="M2.5 7l4 4 5-6"
                                        stroke="var(--color-primary)"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  ) : null}
                                </button>
                              )
                            })()}

                            {/* 날짜별 */}
                            {days.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {days.map((day) => {
                                  const s =
                                    tripStatusMap[trip.id]?.[String(day.dayNumber)] ?? 'idle'
                                  return (
                                    <button
                                      key={day.dayNumber}
                                      onClick={() => handleAddToTrip(trip, String(day.dayNumber))}
                                      disabled={s !== 'idle'}
                                      className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                                        s === 'saved'
                                          ? 'bg-primary/8'
                                          : 'bg-gray-50 active:bg-gray-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold ${
                                            s === 'saved'
                                              ? 'bg-primary text-white'
                                              : 'bg-primary/15 text-primary'
                                          }`}
                                        >
                                          {day.dayNumber}
                                        </span>
                                        <span
                                          className={`text-[13px] font-semibold ${s === 'saved' ? 'text-primary' : 'text-ink2'}`}
                                        >
                                          Day {day.dayNumber}
                                        </span>
                                        <span className="text-ink3 text-[11px]">
                                          {day.date.slice(5).replace('-', '/')}
                                        </span>
                                      </div>
                                      {s === 'saving' ? (
                                        <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                      ) : s === 'saved' ? (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                          <path
                                            d="M2.5 7l4 4 5-6"
                                            stroke="var(--color-primary)"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      ) : (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                          <path
                                            d="M4.5 2.5l3.5 3.5-3.5 3.5"
                                            stroke="#ccc"
                                            strokeWidth="1.3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-ink3 mt-1.5 text-center text-[12px]">
                                {isKo ? '날짜가 설정되지 않았어요' : 'No dates set'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

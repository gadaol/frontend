'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { addToBacklog, getOrCreatePlace } from '@/app/actions/backlog'
import { addCandidatePlace } from '@/app/actions/candidate'
import { addItineraryItem } from '@/app/actions/trip'
import { getUpcomingTrips, type UpcomingTrip } from '@/app/actions/destinations'
import { getDbCategory, getCategoryStyle } from '@/utils/placeCategory'
import { BacklogIcon } from '@/components/icons'
import type { GooglePlace } from '@/types/place'

type DestinationPlace = GooglePlace & { photoRef: string | null }

interface Destination {
  name: string
  nameEn: string
  searchQuery: string
  gradient: string
}

interface Props {
  destination: Destination | null
  onClose: () => void
}

type BacklogStatus = 'idle' | 'saving' | 'saved'
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

export default function DestinationSheet({ destination, onClose }: Props) {
  const locale = useLocale()
  const router = useRouter()
  const isKo = locale === 'ko'

  const [places, setPlaces] = useState<DestinationPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [backlogMap, setBacklogMap] = useState<Record<string, BacklogStatus>>({})
  const [photoErrorIds, setPhotoErrorIds] = useState<Set<string>>(new Set())

  const [tripPickerFor, setTripPickerFor] = useState<string | null>(null)
  const [trips, setTrips] = useState<UpcomingTrip[]>([])
  const [tripsLoading, setTripsLoading] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  // placeId → tripId → dayKey ('candidate' | '1' | '2' ...) → status
  const [tripStatusMap, setTripStatusMap] = useState<
    Record<string, Record<string, Record<string, DayStatus>>>
  >({})

  useEffect(() => {
    /* destination이 바뀌면 이전 목적지의 결과가 잠깐이라도 남으면 안 되므로
       동기 초기화가 필요하다. 의도된 setState라 규칙을 끈다. */
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!destination) {
      setPlaces([])
      setBacklogMap({})
      setPhotoErrorIds(new Set())
      setTripPickerFor(null)
      setSelectedTripId(null)
      return
    }
    setLoading(true)
    /* eslint-enable react-hooks/set-state-in-effect */
    const q = encodeURIComponent(destination.searchQuery)
    fetch(`/api/places/destination?q=${q}`)
      .then((r) => r.json())
      .then((data) => setPlaces(data.places ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [destination])

  async function openTripPicker(placeId: string) {
    setTripPickerFor(placeId)
    setSelectedTripId(null)
    if (trips.length === 0) {
      setTripsLoading(true)
      const result = await getUpcomingTrips()
      setTrips(result)
      setTripsLoading(false)
    }
  }

  async function handleBacklog(place: DestinationPlace) {
    if (backlogMap[place.id] === 'saving' || backlogMap[place.id] === 'saved') return
    setBacklogMap((prev) => ({ ...prev, [place.id]: 'saving' }))
    await addToBacklog({
      googlePlaceId: place.id,
      name: place.displayName.text,
      address: place.formattedAddress,
      categoryName: getDbCategory(place.types ?? []),
      lat: place.location?.latitude ?? null,
      lng: place.location?.longitude ?? null,
      photoRef: place.photoRef,
    })
    setBacklogMap((prev) => ({ ...prev, [place.id]: 'saved' }))
  }

  async function handleAddToTrip(
    place: DestinationPlace,
    trip: UpcomingTrip,
    dayKey: 'candidate' | string,
  ) {
    const currentStatus = tripStatusMap[place.id]?.[trip.id]?.[dayKey] ?? 'idle'
    if (currentStatus !== 'idle') return

    setTripStatusMap((prev) => ({
      ...prev,
      [place.id]: {
        ...prev[place.id],
        [trip.id]: { ...(prev[place.id]?.[trip.id] ?? {}), [dayKey]: 'saving' },
      },
    }))

    try {
      if (dayKey === 'candidate') {
        await addCandidatePlace(
          trip.id,
          place.id,
          place.displayName.text,
          place.formattedAddress,
          getDbCategory(place.types ?? []),
          place.location?.latitude ?? null,
          place.location?.longitude ?? null,
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
            lat: place.location?.latitude ?? null,
            lng: place.location?.longitude ?? null,
          })
          if (placeId) await addItineraryItem(trip.id, day.date, day.dayNumber, placeId)
        }
      }
    } catch {}

    setTripStatusMap((prev) => ({
      ...prev,
      [place.id]: {
        ...prev[place.id],
        [trip.id]: { ...(prev[place.id]?.[trip.id] ?? {}), [dayKey]: 'saved' },
      },
    }))
  }

  if (!destination) return null

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-[70] bg-black/40"
        onClick={() => {
          if (tripPickerFor) {
            setTripPickerFor(null)
            setSelectedTripId(null)
            return
          }
          onClose()
        }}
      />

      {/* 시트 */}
      <div className="fixed inset-x-0 bottom-0 z-[71] flex max-h-[88dvh] flex-col rounded-t-3xl bg-white">
        {/* 핸들 */}
        <div className="flex flex-shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* 헤더 */}
        <div className="flex flex-shrink-0 items-center justify-between px-5 pt-1 pb-3">
          <div>
            <p className="text-ink text-[18px] font-bold">{destination.name}</p>
            <p className="text-ink3 text-[12px]">{isKo ? '인기 여행지' : 'Popular Places'}</p>
          </div>
          <button
            onClick={onClose}
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

        {/* 장소 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-border flex gap-3 border-b px-5 py-3.5">
                  <div className="h-[72px] w-[72px] flex-shrink-0 animate-pulse rounded-2xl bg-gray-100" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : places.length === 0 ? (
            <div className="text-ink3 py-16 text-center text-[14px]">
              {isKo ? '장소를 불러오지 못했어요.' : 'No places found.'}
            </div>
          ) : (
            <div className="divide-border divide-y">
              {places.map((place) => {
                const catStyle = getCategoryStyle(getDbCategory(place.types ?? []))
                const backlogStatus = backlogMap[place.id] ?? 'idle'
                const isActiveTripPicker = tripPickerFor === place.id
                const photoFailed = photoErrorIds.has(place.id)
                const photoUrl =
                  place.photoRef && !photoFailed
                    ? `/api/places/photo?ref=${encodeURIComponent(place.photoRef)}`
                    : null

                return (
                  <div key={place.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      {/* 사진 or 카테고리 아이콘 */}
                      <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-2xl">
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoUrl}
                            alt={place.displayName.text}
                            className="h-full w-full object-cover"
                            onError={() => setPhotoErrorIds((prev) => new Set(prev).add(place.id))}
                          />
                        ) : (
                          <div
                            className={`flex h-full w-full items-center justify-center ${catStyle.bg}`}
                          >
                            <catStyle.icon size={28} className={catStyle.color} />
                          </div>
                        )}
                      </div>

                      {/* 정보 */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-ink truncate text-[14px] font-semibold">
                          {place.displayName.text}
                        </p>
                        <p className="text-ink3 mt-0.5 line-clamp-1 text-[11px]">
                          {place.formattedAddress}
                        </p>
                        {place.rating ? (
                          <p className="text-ink3 mt-1 text-[11px]">
                            ⭐ {place.rating.toFixed(1)}
                            {place.userRatingCount
                              ? ` · ${place.userRatingCount.toLocaleString()}개`
                              : ''}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="mt-2.5 flex gap-2">
                      <button
                        onClick={() => handleBacklog(place)}
                        disabled={backlogStatus !== 'idle'}
                        className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold transition-colors ${
                          backlogStatus === 'saved'
                            ? 'bg-primary/10 text-primary'
                            : 'text-ink2 bg-gray-100'
                        }`}
                      >
                        {backlogStatus === 'saving' ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <>
                            <BacklogIcon
                              size={13}
                              filled={backlogStatus === 'saved'}
                              className={backlogStatus === 'saved' ? 'text-primary' : 'text-ink2'}
                            />
                            {backlogStatus === 'saved'
                              ? isKo
                                ? '저장됨'
                                : 'Saved'
                              : isKo
                                ? '백로그'
                                : 'Backlog'}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          isActiveTripPicker
                            ? (setTripPickerFor(null), setSelectedTripId(null))
                            : openTripPicker(place.id)
                        }
                        className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold transition-colors ${
                          isActiveTripPicker ? 'bg-primary text-white' : 'text-ink2 bg-gray-100'
                        }`}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                          <line x1="12" y1="14" x2="12" y2="18" />
                          <line x1="10" y1="16" x2="14" y2="16" />
                        </svg>
                        {isKo ? '일정 추가' : 'Add to Trip'}
                      </button>
                    </div>

                    {/* 여행 선택 패널 */}
                    {isActiveTripPicker && (
                      <div className="border-border mt-2 rounded-2xl border bg-gray-50 p-3">
                        <p className="text-ink3 mb-2 text-[11px] font-semibold">
                          {isKo ? '어느 여행에 추가할까요?' : 'Add to which trip?'}
                        </p>

                        {/* 새 여행 만들기 */}
                        <button
                          onClick={() => router.push(`/${locale}/trips/new`)}
                          className="border-primary/20 bg-primary/5 active:bg-primary/10 mb-2 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors"
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
                          <span className="text-primary text-[12px] font-semibold">
                            {isKo ? '새 여행 만들기' : 'Create new trip'}
                          </span>
                        </button>

                        {tripsLoading ? (
                          <p className="text-ink3 py-2 text-center text-[12px]">
                            {isKo ? '여행 불러오는 중...' : 'Loading trips...'}
                          </p>
                        ) : trips.length === 0 ? (
                          <p className="text-ink3 py-1 text-center text-[12px]">
                            {isKo ? '진행 중인 여행이 없어요.' : 'No active trips.'}
                          </p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {trips.map((trip) => {
                              const isExpanded = selectedTripId === trip.id
                              const days =
                                trip.start_date && trip.end_date
                                  ? computeDays(trip.start_date, trip.end_date)
                                  : []

                              return (
                                <div key={trip.id} className="overflow-hidden rounded-xl bg-white">
                                  {/* 여행 행 */}
                                  <button
                                    onClick={() => setSelectedTripId(isExpanded ? null : trip.id)}
                                    className="flex w-full items-center justify-between px-3 py-2.5 text-left active:bg-gray-50"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-ink truncate text-[13px] font-semibold">
                                        {trip.title}
                                      </p>
                                      {trip.destination && (
                                        <p className="text-ink3 text-[11px]">{trip.destination}</p>
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

                                  {/* 날짜 선택 패널 */}
                                  {isExpanded && (
                                    <div className="border-border border-t px-3 pt-2 pb-2.5">
                                      {/* 후보에 추가 */}
                                      {(() => {
                                        const s =
                                          tripStatusMap[place.id]?.[trip.id]?.['candidate'] ??
                                          'idle'
                                        return (
                                          <button
                                            onClick={() =>
                                              handleAddToTrip(place, trip, 'candidate')
                                            }
                                            disabled={s !== 'idle'}
                                            className={`mt-0.5 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                                              s === 'saved'
                                                ? 'bg-primary/8'
                                                : 'bg-gray-50 active:bg-gray-100'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
                                                <svg
                                                  width="9"
                                                  height="9"
                                                  viewBox="0 0 9 9"
                                                  fill="none"
                                                >
                                                  <path
                                                    d="M4.5 1.5v6M1.5 4.5h6"
                                                    stroke="#888"
                                                    strokeWidth="1.3"
                                                    strokeLinecap="round"
                                                  />
                                                </svg>
                                              </div>
                                              <span
                                                className={`text-[12px] font-semibold ${s === 'saved' ? 'text-primary' : 'text-ink2'}`}
                                              >
                                                {isKo ? '후보에 추가' : 'Add as candidate'}
                                              </span>
                                            </div>
                                            {s === 'saving' ? (
                                              <div className="border-primary h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent" />
                                            ) : s === 'saved' ? (
                                              <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 14 14"
                                                fill="none"
                                              >
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
                                        <div className="mt-1.5 flex flex-col gap-1">
                                          {days.map((day) => {
                                            const s =
                                              tripStatusMap[place.id]?.[trip.id]?.[
                                                String(day.dayNumber)
                                              ] ?? 'idle'
                                            return (
                                              <button
                                                key={day.dayNumber}
                                                onClick={() =>
                                                  handleAddToTrip(
                                                    place,
                                                    trip,
                                                    String(day.dayNumber),
                                                  )
                                                }
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
                                                    className={`text-[12px] font-semibold ${s === 'saved' ? 'text-primary' : 'text-ink2'}`}
                                                  >
                                                    {isKo
                                                      ? `Day ${day.dayNumber}`
                                                      : `Day ${day.dayNumber}`}
                                                  </span>
                                                  <span className="text-ink3 text-[11px]">
                                                    {day.date.slice(5).replace('-', '/')}
                                                  </span>
                                                </div>
                                                {s === 'saving' ? (
                                                  <div className="border-primary h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent" />
                                                ) : s === 'saved' ? (
                                                  <svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 14 14"
                                                    fill="none"
                                                  >
                                                    <path
                                                      d="M2.5 7l4 4 5-6"
                                                      stroke="var(--color-primary)"
                                                      strokeWidth="1.6"
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                    />
                                                  </svg>
                                                ) : (
                                                  <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                  >
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
                                        <p className="text-ink3 mt-1.5 text-center text-[11px]">
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
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

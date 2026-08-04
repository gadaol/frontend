'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { ListIcon, SearchIcon, BacklogIcon, ChevronRightIcon } from '@/components/icons'
import { getCategoryInfo, getMarkerColor } from '@/utils/placeCategory'
import { addToBacklog } from '@/app/actions/backlog'

type GooglePlace = {
  id: string
  displayName: { text: string; languageCode: string }
  formattedAddress: string
  types: string[]
  rating?: number
  userRatingCount?: number
  location?: { latitude: number; longitude: number }
}

const MAP_DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
}

interface Props {
  headerTitle: string
}

export default function PlacesSearch({ headerTitle: _headerTitle }: Props) {
  const t = useTranslations('places')
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GooglePlace[]>([])
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null)
  const [mapCenter, setMapCenter] = useState(MAP_DEFAULT_CENTER)
  const [showList, setShowList] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  })

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      startTransition(() => {
        setResults([])
        setHasSearched(false)
        setShowList(false)
      })
      return
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        const places: GooglePlace[] = data.places ?? []
        setResults(places)
        setHasSearched(true)
        setShowList(places.length > 0)

        const first = places[0]
        if (first?.location) {
          const center = { lat: first.location.latitude, lng: first.location.longitude }
          setMapCenter(center)
          mapRef.current?.panTo(center)
          mapRef.current?.setZoom(14)
        }
      })
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function focusPlace(place: GooglePlace) {
    setSelectedPlace(place)
    if (place.location) {
      mapRef.current?.panTo({ lat: place.location.latitude, lng: place.location.longitude })
      mapRef.current?.setZoom(16)
    }
  }

  async function handleSave(place: GooglePlace, e: React.MouseEvent) {
    e.stopPropagation()
    if (savedIds.has(place.id) || savingIds.has(place.id)) return

    setSavingIds((prev) => new Set(prev).add(place.id))
    await addToBacklog({
      googlePlaceId: place.id,
      name: place.displayName.text,
      address: place.formattedAddress,
      categoryName: place.types[0] ?? null,
    })
    setSavedIds((prev) => new Set(prev).add(place.id))
    setSavingIds((prev) => {
      const next = new Set(prev)
      next.delete(place.id)
      return next
    })
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* 지도 */}
      <div className="absolute inset-0">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={13}
            options={MAP_OPTIONS}
            onLoad={onMapLoad}
            onClick={() => setSelectedPlace(null)}
          >
            {results.map((place) =>
              place.location ? (
                <Marker
                  key={place.id}
                  position={{ lat: place.location.latitude, lng: place.location.longitude }}
                  onClick={() => focusPlace(place)}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: selectedPlace?.id === place.id ? 10 : 8,
                    fillColor: getMarkerColor(place.types),
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  }}
                />
              ) : null,
            )}

            {selectedPlace?.location && (
              <InfoWindow
                position={{
                  lat: selectedPlace.location.latitude,
                  lng: selectedPlace.location.longitude,
                }}
                onCloseClick={() => setSelectedPlace(null)}
                options={{ pixelOffset: new google.maps.Size(0, -12) }}
              >
                <div
                  style={{
                    width: 200,
                    boxSizing: 'border-box',
                    padding: '8px',
                    fontFamily: 'inherit',
                    overflow: 'hidden',
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#111111',
                      margin: 0,
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedPlace.displayName.text}
                  </p>
                  <p style={{ fontSize: 12, color: '#888888', margin: '3px 0 0', lineHeight: 1.4 }}>
                    {getCategoryInfo(selectedPlace.types).label}
                  </p>
                  {selectedPlace.rating && (
                    <p style={{ fontSize: 12, color: '#555555', margin: '3px 0 0' }}>
                      ★ {selectedPlace.rating.toFixed(1)}
                      {selectedPlace.userRatingCount ? (
                        <span style={{ color: '#888888' }}>
                          {' '}
                          ({selectedPlace.userRatingCount.toLocaleString()})
                        </span>
                      ) : null}
                    </p>
                  )}
                  <Link
                    href={`/${locale}/places/${selectedPlace.id}`}
                    style={{
                      display: 'block',
                      marginTop: 10,
                      padding: '7px 0 2px',
                      textAlign: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#1B6FF0',
                      textDecoration: 'none',
                      borderTop: '1px solid #EEEEEE',
                    }}
                  >
                    {t('viewDetail')}
                  </Link>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="bg-bg2 flex h-full items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        )}
      </div>

      {/* 검색바 오버레이 */}
      <div className="relative z-10 px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white px-3.5 py-3 shadow-lg">
          <SearchIcon className="flex-shrink-0 text-[#9099A8]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent text-[15px] text-[#0F1117] outline-none placeholder:text-[#9099A8]"
            autoComplete="off"
          />
          {isPending && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1B6FF0] border-t-transparent" />
          )}
        </div>
      </div>

      {/* 초기 안내 */}
      {!hasSearched && query.length < 2 && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-end pb-20 text-center">
          <div className="mx-4 rounded-3xl bg-white/90 px-6 py-5 shadow-lg backdrop-blur-sm">
            <p className="text-[14px] font-semibold text-[#0F1117]">{t('searchHint')}</p>
            <p className="mt-0.5 text-[12px] text-[#9099A8]">{t('searchHintDesc')}</p>
          </div>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {hasSearched && results.length === 0 && !isPending && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-end pb-20">
          <div className="mx-4 rounded-3xl bg-white/90 px-6 py-4 shadow-lg backdrop-blur-sm">
            <p className="text-center text-[14px] text-[#9099A8]">{t('noResults')}</p>
          </div>
        </div>
      )}

      {/* 리스트 토글 버튼 */}
      {results.length > 0 && (
        <div
          className="pointer-events-none absolute right-4 z-20 flex flex-col items-end"
          style={{
            bottom: showList
              ? 'calc(var(--list-height, 240px) + 12px)'
              : 'calc(env(safe-area-inset-bottom) + 16px)',
          }}
        >
          <button
            onClick={() => setShowList((v) => !v)}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2.5 shadow-lg"
          >
            <ListIcon size={16} className={showList ? 'text-[#1B6FF0]' : 'text-[#9099A8]'} />
            <span
              className={`text-[13px] font-semibold ${showList ? 'text-[#1B6FF0]' : 'text-[#9099A8]'}`}
            >
              {showList ? t('hideList') : t('showList')}
            </span>
          </button>
        </div>
      )}

      {/* 결과 리스트 하단 시트 */}
      {showList && results.length > 0 && (
        <div className="relative z-10 mt-auto">
          <div className="rounded-t-3xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[14px] font-semibold text-[#0F1117]">
                {t('results', { count: results.length })}
              </span>
              <div className="h-1 w-8 rounded-full bg-[#E8EAED]" />
            </div>

            <div className="max-h-56 overflow-y-auto pb-4">
              {results.map((place) => {
                const category = getCategoryInfo(place.types)
                const Icon = category.icon
                const isSaved = savedIds.has(place.id)
                const isSaving = savingIds.has(place.id)

                return (
                  <div
                    key={place.id}
                    className="flex items-center gap-0 px-4 py-2.5 active:bg-[#F5F6FA]"
                  >
                    {/* 지도 포커스 영역 (좌측 + 중앙) */}
                    <button
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => focusPlace(place)}
                    >
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] ${category.bg}`}
                      >
                        <Icon size={18} className={category.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-[#0F1117]">
                          {place.displayName.text}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-[#9099A8]">
                          {place.formattedAddress}
                        </p>
                        {place.rating && (
                          <p className="mt-0.5 text-[11px] text-[#9099A8]">
                            ★ {place.rating.toFixed(1)}
                          </p>
                        )}
                      </div>
                    </button>

                    {/* 백로그 저장 버튼 */}
                    <button
                      onClick={(e) => handleSave(place, e)}
                      disabled={isSaved || isSaving}
                      className="ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                      aria-label={isSaved ? t('savedToBacklog') : t('saveToBacklog')}
                    >
                      {isSaving ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1B6FF0] border-t-transparent" />
                      ) : (
                        <BacklogIcon
                          size={20}
                          filled={isSaved}
                          className={isSaved ? 'text-[#1B6FF0]' : 'text-[#C4C8CF]'}
                        />
                      )}
                    </button>

                    {/* 상세 진입 버튼 */}
                    <Link
                      href={`/${locale}/places/${place.id}`}
                      className="ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                      aria-label={t('viewDetail')}
                    >
                      <ChevronRightIcon size={18} className="text-[#C4C8CF]" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

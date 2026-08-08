'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { SearchIcon, ChevronRightIcon } from '@/components/icons'
import { getCategoryInfo, getCategoryStyle, getMarkerColor } from '@/utils/placeCategory'
import type { GooglePlace } from '@/types/place'

export type { GooglePlace }

// ─── 카테고리 칩 (8개 DB 카테고리) ──────────────────────────────────────────
const CATEGORY_CHIPS = (
  ['식당', '카페', '관광지', '숙소', '쇼핑', '자연', '액티비티', '기타'] as const
).map(getCategoryStyle)

// ─── 추천 장소 목 데이터 (TODO: API 연동) ─────────────────────────────────────
type RecommendationItem = { id: string; name: string; address: string; categoryName: string }
const MOCK_RECOMMENDATIONS: RecommendationItem[] = [
  { id: 'r1', name: '추천 장소 이름', address: '서울시 강남구 어딘가', categoryName: '식당' },
  { id: 'r2', name: '추천 카페 이름', address: '서울시 마포구 어딘가', categoryName: '카페' },
  { id: 'r3', name: '추천 관광지 이름', address: '서울시 종로구 어딘가', categoryName: '관광지' },
]

const MAP_DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  clickableIcons: false,
  gestureHandling: 'greedy',
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
}

interface Props {
  /** 리스트 각 아이템 우측 액션 버튼 렌더 */
  renderListAction: (place: GooglePlace) => React.ReactNode
  /** InfoWindow CTA (없으면 상세보기 링크) */
  renderInfoCta?: (place: GooglePlace) => React.ReactNode
  /** 하단 고정 바 높이(px) — 리스트 시트가 가려지지 않도록 여백 추가 */
  bottomOffset?: number
  /** 여행 목적지 — 지도 초기 중심 설정에 사용 */
  destination?: string | null
}

export default function PlaceMapSearch({
  renderListAction,
  renderInfoCta,
  bottomOffset = 0,
  destination,
}: Props) {
  const t = useTranslations('places')
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GooglePlace[]>([])
  const [, startTransition] = useTransition()
  const [isPending, setIsPending] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null)
  const [mapCenter, setMapCenter] = useState(MAP_DEFAULT_CENTER)
  const [showList, setShowList] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(true)
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  })

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  useEffect(() => {
    if (!isLoaded || !destination) return
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ address: destination }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location
        const center = { lat: loc.lat(), lng: loc.lng() }
        setMapCenter(center)
        mapRef.current?.panTo(center)
      }
    })
  }, [isLoaded, destination])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 5000 },
    )
  }, [])

  function handleMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMyLocation(loc)
        mapRef.current?.panTo(loc)
        mapRef.current?.setZoom(15)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 },
    )
  }

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

    debounceRef.current = setTimeout(async () => {
      setIsPending(true)
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      const places: GooglePlace[] = data.places ?? []
      setResults(places)
      setHasSearched(true)
      setShowList(places.length > 0)
      setIsPending(false)

      const first = places[0]
      if (first?.location) {
        const center = { lat: first.location.latitude, lng: first.location.longitude }
        setMapCenter(center)
        mapRef.current?.panTo(center)
        mapRef.current?.setZoom(14)
      }
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
            {myLocation && (
              <Marker
                position={myLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#4A90E2',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 3,
                }}
              />
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
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#111',
                      margin: 0,
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedPlace.displayName.text}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: getCategoryInfo(selectedPlace.types).hex,
                      fontWeight: 600,
                      margin: '3px 0 0',
                      lineHeight: 1.4,
                    }}
                  >
                    {getCategoryInfo(selectedPlace.types).hashLabel}
                  </p>
                  {selectedPlace.rating && (
                    <p style={{ fontSize: 12, color: '#555', margin: '3px 0 0' }}>
                      ★ {selectedPlace.rating.toFixed(1)}
                      {selectedPlace.userRatingCount ? (
                        <span style={{ color: '#888' }}>
                          {' '}
                          ({selectedPlace.userRatingCount.toLocaleString()})
                        </span>
                      ) : null}
                    </p>
                  )}
                  {renderInfoCta ? (
                    renderInfoCta(selectedPlace)
                  ) : (
                    <Link
                      href={`/${locale}/places/${selectedPlace.id}`}
                      style={{
                        display: 'block',
                        marginTop: 10,
                        padding: '7px 0 2px',
                        textAlign: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        borderTop: '1px solid #EEE',
                      }}
                    >
                      {t('viewDetail')}
                    </Link>
                  )}
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

      {/* 검색바 + 내위치 버튼 */}
      <div className="relative z-10 px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white px-3.5 py-3 shadow-lg">
          <SearchIcon className="text-ink3 flex-shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="text-ink placeholder:text-ink3 flex-1 bg-transparent text-[15px] outline-none"
            autoComplete="off"
          />
          {isPending && (
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          )}
        </div>
        {/* 내 위치 버튼 — 검색바 우측 아래 고정 */}
        <button
          onClick={handleMyLocation}
          className="absolute right-4 -bottom-12 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
        >
          {locating ? (
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3.5" fill="var(--color-primary)" />
              <circle cx="10" cy="10" r="6" stroke="var(--color-primary)" strokeWidth="1.5" />
              <path
                d="M10 2v2M10 16v2M2 10h2M16 10h2"
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* 초기 추천 패널 */}
      {!hasSearched && query.length < 2 && (
        <div className="relative z-10 mt-auto min-h-0">
          <div className="rounded-t-3xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
            {/* 헤더 (항상 노출 — 토글) */}
            <button
              onClick={() => setShowRecommendations((v) => !v)}
              className="border-border flex w-full items-center justify-between border-b px-5 py-3"
            >
              <span className="text-ink text-[14px] font-semibold">추천 장소</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                className={`transition-transform duration-300 ${showRecommendations ? 'rotate-180' : ''}`}
              >
                <path
                  d="M4.5 11L9 6.5l4.5 4.5"
                  stroke="var(--color-ink3)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* 접히는 영역 */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: showRecommendations ? 600 : 0 }}
            >
              {/* 카테고리 칩 */}
              <div className="border-border relative border-b">
                <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  <div className="flex gap-2 px-4 py-3 pr-10">
                    {CATEGORY_CHIPS.map((cat) => {
                      const CatIcon = cat.icon
                      return (
                        <button
                          key={cat.label}
                          onClick={() => setQuery(cat.label)}
                          className="flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold active:opacity-70"
                          style={{
                            borderColor: cat.hex + '50',
                            color: cat.hex,
                            backgroundColor: cat.hex + '14',
                          }}
                        >
                          <CatIcon size={13} className="flex-shrink-0" />
                          {cat.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* 우측 페이드 */}
                <div className="pointer-events-none absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-white to-transparent" />
              </div>

              {/* 추천 장소 목록 (TODO: API 연동) */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: 224, paddingBottom: bottomOffset > 0 ? bottomOffset + 8 : 16 }}
              >
                {MOCK_RECOMMENDATIONS.map((item) => {
                  const cat = getCategoryStyle(item.categoryName)
                  const CatIcon = cat.icon
                  return (
                    <div key={item.id} className="active:bg-bg2 flex items-center px-4 py-2.5">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] ${cat.bg}`}
                        >
                          <CatIcon size={18} className={cat.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-ink truncate text-[14px] font-semibold">{item.name}</p>
                          <p className="text-ink3 truncate text-[11px]">{item.address}</p>
                          <p
                            className="mt-0.5 text-[11px] font-semibold"
                            style={{ color: cat.hex }}
                          >
                            {cat.hashLabel}
                          </p>
                        </div>
                      </div>
                      <div className="ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center">
                        <ChevronRightIcon size={18} className="text-[#C4C8CF]" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 결과 없음 */}
      {hasSearched && results.length === 0 && !isPending && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-end pb-20">
          <div className="mx-4 rounded-3xl bg-white/90 px-6 py-4 shadow-lg backdrop-blur-sm">
            <p className="text-ink3 text-center text-[14px]">{t('noResults')}</p>
          </div>
        </div>
      )}

      {/* 결과 있을 때 스페이서 — 검색바와 시트 헤더 사이 지도가 보이도록 */}
      {results.length > 0 && <div className="flex-1" />}

      {/* 결과 리스트 하단 시트 */}
      {results.length > 0 && (
        <div className="relative z-10 mt-auto min-h-0">
          <div className="rounded-t-3xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
            {/* 토글 헤더 — PlacesMapTab과 동일 패턴 */}
            <button
              onClick={() => setShowList((v) => !v)}
              className="border-border flex w-full items-center justify-between border-b px-5 py-3"
            >
              <span className="text-ink text-[14px] font-semibold">
                {t('results', { count: results.length })}
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                className={`transition-transform duration-300 ${showList ? 'rotate-180' : ''}`}
              >
                <path
                  d="M4.5 11L9 6.5l4.5 4.5"
                  stroke="var(--color-ink3)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: showList ? 800 : 0 }}
            >
              <div
                className="overflow-y-auto"
                style={{ maxHeight: 224, paddingBottom: bottomOffset > 0 ? bottomOffset + 8 : 16 }}
              >
                {results.map((place) => {
                  const category = getCategoryInfo(place.types)
                  const Icon = category.icon
                  return (
                    <div
                      key={place.id}
                      className="active:bg-bg2 flex items-center gap-0 px-4 py-2.5"
                    >
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
                          <p className="text-ink truncate text-[14px] font-semibold">
                            {place.displayName.text}
                          </p>
                          <p className="text-ink3 mt-0.5 truncate text-[11px]">
                            {place.formattedAddress}
                          </p>
                          <p
                            className="mt-0.5 truncate text-[11px] font-semibold"
                            style={{ color: category.hex }}
                          >
                            {category.hashLabel}
                          </p>
                        </div>
                      </button>
                      {renderListAction(place)}
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
        </div>
      )}
    </div>
  )
}

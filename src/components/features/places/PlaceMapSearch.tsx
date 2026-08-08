'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, OverlayView } from '@react-google-maps/api'
import { SearchIcon, ChevronRightIcon } from '@/components/icons'
import MarkdownContent from '@/components/ui/MarkdownContent'
import { getCategoryInfo, getCategoryStyle, getMarkerColor } from '@/utils/placeCategory'
import PlacePhoto from '@/components/features/places/PlacePhoto'
import { createClient } from '@/lib/supabase/client'
import type { GooglePlace } from '@/types/place'

export type { GooglePlace }

// ─── 카테고리 칩 (8개 DB 카테고리) ──────────────────────────────────────────
const CATEGORY_CHIPS = (
  ['식당', '카페', '관광지', '숙소', '쇼핑', '자연', '액티비티', '기타'] as const
).map(getCategoryStyle)

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
  /** 서버에서 미리 받아온 아바타 URL — 첫 렌더부터 바로 표시 */
  initialAvatar?: string | null
  /** 서버에서 미리 받아온 이름 */
  initialName?: string | null
  /** 검색바 아래 추가 UI (AI 검색 버튼 등) */
  headerExtra?: React.ReactNode
  /** 여행 컨텍스트 — 있으면 AI 추천이 해당 여행 목적지 기반으로 동작 */
  tripId?: string
}

export default function PlaceMapSearch({
  renderListAction,
  renderInfoCta,
  bottomOffset = 0,
  destination,
  initialAvatar = null,
  initialName = null,
  headerExtra,
  tripId,
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
  const [userAvatar, setUserAvatar] = useState<string | null>(initialAvatar)
  const [userName, setUserName] = useState<string | null>(initialName)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  // AI 추천 스트리밍
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDone, setAiDone] = useState(false)
  const aiAbortRef = useRef<AbortController | null>(null)

  const fetchAIRecommend = useCallback(async () => {
    if (aiLoading) return
    setAiText('')
    setAiDone(false)
    setAiLoading(true)
    aiAbortRef.current?.abort()
    aiAbortRef.current = new AbortController()
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          ...(tripId && { tripId }),
          ...(destination && { destination }),
        }),
        signal: aiAbortRef.current.signal,
      })
      if (!res.ok || !res.body) throw new Error('failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        setAiText((prev) => prev + decoder.decode(value, { stream: true }))
      }
      setAiDone(true)
    } catch (e) {
      if ((e as Error).name !== 'AbortError')
        setAiText(locale === 'ko' ? '추천을 불러오지 못했어요.' : 'Failed to load recommendations.')
    } finally {
      setAiLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  useEffect(() => {
    return () => {
      aiAbortRef.current?.abort()
    }
  }, [])

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  })

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setUserAvatar(data.avatar_url)
            setUserName(data.name)
          }
        })
    })
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
              <OverlayView
                key={`myloc-${userAvatar ?? 'none'}-${userName ?? 'none'}`}
                position={myLocation}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                  {userAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userAvatar}
                      alt={userName ?? '나'}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                        backgroundColor: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {userName?.[0] ?? '나'}
                    </div>
                  )}
                </div>
              </OverlayView>
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
                    {`#${t(getCategoryInfo(selectedPlace.types).i18nKey as never)}`}
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
        {headerExtra && <div className="mt-2.5 flex items-center gap-2">{headerExtra}</div>}
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
              <span className="text-ink text-[14px] font-semibold">AI 추천 장소</span>
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

              {/* AI 취향 추천 스트리밍 */}
              <div
                className="overflow-y-auto px-4 pt-3"
                style={{ maxHeight: 224, paddingBottom: bottomOffset > 0 ? bottomOffset + 8 : 16 }}
              >
                {aiLoading && !aiText && (
                  <div className="text-ink3 flex items-center gap-2 py-1 text-[13px]">
                    <div className="border-primary h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent" />
                    {locale === 'ko'
                      ? 'AI가 취향에 맞는 장소를 찾고 있어요...'
                      : 'Finding places for you...'}
                  </div>
                )}
                {aiText && (
                  <>
                    <MarkdownContent text={aiText} size="sm" />
                    {aiLoading && (
                      <span className="bg-ink3 ml-0.5 inline-block h-3.5 w-0.5 animate-pulse align-text-bottom" />
                    )}
                  </>
                )}
                {aiDone && (
                  <button
                    onClick={() => {
                      setAiText('')
                      setAiDone(false)
                      fetchAIRecommend()
                    }}
                    className="border-border text-ink2 active:bg-bg2 mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-semibold"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M1.5 7A5.5 5.5 0 1 0 3 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M1.5 2v1.5H3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {locale === 'ko' ? '다시 추천 받기' : 'Refresh'}
                  </button>
                )}
                {!aiText && !aiLoading && !aiDone && (
                  <button
                    onClick={fetchAIRecommend}
                    className="my-1 flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition-opacity active:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)' }}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
                      <span className="text-[18px]">✨</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-white">
                        {locale === 'ko' ? 'AI 맞춤 장소 추천' : 'Get AI Recommendations'}
                      </p>
                      <p className="text-[11px] text-white/70">
                        {locale === 'ko'
                          ? '내 취향에 딱 맞는 장소를 찾아줄게요'
                          : 'Places matched to your taste'}
                      </p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="flex-shrink-0"
                    >
                      <path
                        d="M6 3.5l4.5 4.5L6 12.5"
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
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
                  return (
                    <div
                      key={place.id}
                      className="active:bg-bg2 flex items-center gap-0 px-4 py-2.5"
                    >
                      <button
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        onClick={() => focusPlace(place)}
                      >
                        <PlacePhoto
                          photoRef={place.photos?.[0]?.name ?? null}
                          categoryStyle={category}
                          iconSize={18}
                          className="h-9 w-9 flex-shrink-0 rounded-[10px]"
                        />
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
                            {`#${t(category.i18nKey as never)}`}
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

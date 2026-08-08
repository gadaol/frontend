'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline, OverlayView } from '@react-google-maps/api'
import { getCategoryInfoByLabel } from '@/utils/placeCategory'
import { getDayColor } from '@/utils/dayColors'
import type { TripDetail } from '../page'

const MAP_H = 224
const BOTTOM_NAV_H = 56
const PANEL_HEADER_H = 56

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  clickableIcons: true,
  gestureHandling: 'greedy',
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
}

type PlacePin = {
  id: string
  name: string
  address: string | null
  lat: number
  lng: number
  dayNumber: number
  dayDate: string
  color: string
  orderIndex: number
  categoryName: string | null
}

interface Props {
  trip: TripDetail
  currentUserAvatar: string | null
  currentUserName: string | null
}

export default function PlacesMapTab({ trip, currentUserAvatar, currentUserName }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const polylineRefs = useRef<Map<number, google.maps.Polyline>>(new Map())
  const [selectedPin, setSelectedPin] = useState<PlacePin | null>(null)
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [listOpen, setListOpen] = useState(true)
  const [showRoute, setShowRoute] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => {
    polylineRefs.current.forEach((polyline, dayNum) => {
      polyline.setVisible(showRoute && (selectedDay === null || selectedDay === dayNum))
    })
  }, [showRoute, selectedDay])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000, enableHighAccuracy: false },
    )
  }, [])

  const maxDayNumber = useMemo(
    () => Math.max(1, ...trip.itinerary_days.map((d) => d.day_number)),
    [trip.itinerary_days],
  )

  const pins: PlacePin[] = useMemo(
    () =>
      trip.itinerary_days
        .slice()
        .sort((a, b) => a.day_number - b.day_number)
        .flatMap((day) =>
          day.itinerary_items
            .filter((item) => item.places?.lat != null && item.places?.lng != null)
            .sort((a, b) => a.order_index - b.order_index)
            .map((item) => ({
              id: item.id,
              name: item.places!.name,
              address: item.places!.address,
              lat: item.places!.lat as number,
              lng: item.places!.lng as number,
              dayNumber: day.day_number,
              dayDate: day.day_date,
              color: getDayColor(day.day_number, maxDayNumber),
              orderIndex: item.order_index,
              categoryName: item.places!.place_categories?.name ?? null,
            })),
        ),
    [trip.itinerary_days, maxDayNumber],
  )

  const dayGroups = useMemo(() => {
    const groups = new Map<number, PlacePin[]>()
    for (const pin of pins) {
      if (!groups.has(pin.dayNumber)) groups.set(pin.dayNumber, [])
      groups.get(pin.dayNumber)!.push(pin)
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0])
  }, [pins])

  const center =
    pins.length > 0 ? { lat: pins[0].lat, lng: pins[0].lng } : { lat: 37.5665, lng: 126.978 }

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map
      if (pins.length > 1) {
        const bounds = new window.google.maps.LatLngBounds()
        pins.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }))
        map.fitBounds(bounds, 80)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  function handlePinClick(pin: PlacePin) {
    setSelectedPin(pin)
    mapRef.current?.panTo({ lat: pin.lat, lng: pin.lng })
  }

  function handleMyLocation() {
    if (myLocation) {
      mapRef.current?.panTo(myLocation)
      mapRef.current?.setZoom(15)
      return
    }
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

  const hasAnyItems = trip.itinerary_days.some((d) => d.itinerary_items.length > 0)

  if (!isLoaded) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  if (!hasAnyItems) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="bg-primary-light flex h-16 w-16 items-center justify-center rounded-[20px]">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path d="M15 3C10.5 3 6 7.05 6 12c0 6 9 15 9 15s9-9 9-15c0-4.95-4.05-9-9-9z" stroke="var(--color-primary)" strokeWidth="2" />
            <circle cx="15" cy="12" r="3" stroke="var(--color-primary)" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <p className="text-ink mb-1 text-[15px] font-semibold">아직 장소가 없어요</p>
          <p className="text-ink3 text-[13px]">일정에 장소를 추가하면 지도에 표시돼요</p>
        </div>
      </div>
    )
  }

  return (
    // relative + flex-1 min-h-0 로 부모 높이 전체 차지, 내부는 absolute로 배치
    <div className="relative min-h-0 flex-1">
      {/* 지도: 열릴때 224px 고정, 닫힐때 패널 헤더 위까지 채움 */}
      <div
        className="absolute top-0 right-0 left-0"
        style={listOpen ? { height: MAP_H } : { bottom: BOTTOM_NAV_H + PANEL_HEADER_H }}
      >
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={13}
          options={MAP_OPTIONS}
          onLoad={onLoad}
          onClick={() => setSelectedPin(null)}
        >
          {dayGroups.map(([dayNum, dayPins]) =>
            dayPins.length > 1 ? (
              <Polyline
                key={`route-${dayNum}`}
                path={dayPins.map((p) => ({ lat: p.lat, lng: p.lng }))}
                options={{
                  strokeColor: dayPins[0].color,
                  strokeOpacity: 0.75,
                  strokeWeight: 2.5,
                  visible: false,
                }}
                onLoad={(pl) => {
                  polylineRefs.current.set(dayNum, pl)
                  pl.setVisible(showRoute && (selectedDay === null || selectedDay === dayNum))
                }}
                onUnmount={() => polylineRefs.current.delete(dayNum)}
              />
            ) : null,
          )}
          {pins.filter((p) => selectedDay === null || p.dayNumber === selectedDay).map((pin) => (
            <Marker
              key={pin.id}
              position={{ lat: pin.lat, lng: pin.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: selectedPin?.id === pin.id ? 11 : 9,
                fillColor: pin.color,
                fillOpacity: 0.9,
                strokeColor: '#fff',
                strokeWeight: 2,
              }}
              label={{
                text: String(pin.orderIndex + 1),
                color: '#fff',
                fontSize: '9px',
                fontWeight: '700',
              }}
              onClick={() => handlePinClick(pin)}
            />
          ))}
          {myLocation && (
            <OverlayView
              key={`myloc-${currentUserAvatar ?? 'none'}`}
              position={myLocation}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                {currentUserAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUserAvatar}
                    alt={currentUserName ?? '나'}
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
                  <div style={{
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
                  }}>
                    {currentUserName?.[0] ?? '나'}
                  </div>
                )}
              </div>
            </OverlayView>
          )}
          {selectedPin && (
            <InfoWindow
              position={{ lat: selectedPin.lat, lng: selectedPin.lng }}
              onCloseClick={() => setSelectedPin(null)}
            >
              <div style={{ maxWidth: 180, padding: '6px 4px 4px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>
                  {selectedPin.name}
                </p>
                {selectedPin.address && (
                  <p style={{ fontSize: 11, color: 'var(--color-ink3)', marginBottom: 4, lineHeight: 1.4 }}>
                    {selectedPin.address}
                  </p>
                )}
                <p style={{ fontSize: 11, color: selectedPin.color, fontWeight: 600 }}>
                  Day {selectedPin.dayNumber} · {selectedPin.orderIndex + 1}번째
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Day 필터 칩 */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedDay(null)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm transition-colors ${selectedDay === null ? 'bg-ink text-white' : 'bg-white text-ink3'}`}
          >
            전체
          </button>
          {dayGroups.map(([dayNum, dayPins]) => (
            <button
              key={dayNum}
              onClick={() => setSelectedDay(selectedDay === dayNum ? null : dayNum)}
              className="rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm transition-colors"
              style={
                selectedDay === dayNum
                  ? { backgroundColor: dayPins[0].color, color: '#fff' }
                  : { backgroundColor: '#fff', color: dayPins[0].color }
              }
            >
              D{dayNum}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowRoute((v) => !v)}
          className={`absolute right-3 bottom-16 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-colors ${showRoute ? 'bg-primary text-white' : 'bg-white text-ink3'}`}
          title={showRoute ? '경로 숨기기' : '경로 보기'}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 14c0-2 1.5-3 3-3s3 1 4.5 1S13 11 13 9s-1.5-4-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="3" cy="14" r="1.5" fill="currentColor" />
            <circle cx="15" cy="5" r="1.5" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={handleMyLocation}
          className="absolute right-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
        >
          {locating ? (
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3.5" fill="var(--color-primary)" />
              <circle cx="10" cy="10" r="6" stroke="var(--color-primary)" strokeWidth="1.5" />
              <path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* 패널: 열릴때 지도 아래~하단네비 위, 닫힐때 하단네비 바로 위에 헤더만 */}
      <div
        className="absolute right-0 left-0 flex flex-col rounded-t-2xl bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.1)]"
        style={
          listOpen
            ? { top: MAP_H, bottom: BOTTOM_NAV_H }
            : { bottom: BOTTOM_NAV_H }
        }
      >
        {/* 바 핸들 토글 */}
        <button
          onClick={() => setListOpen((v) => !v)}
          className="flex w-full flex-col items-center gap-2 pt-3 pb-1"
        >
          <div className="h-[5px] w-10 rounded-full bg-gray-300" />
          <div className="flex w-full items-center justify-between px-4 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-ink text-[14px] font-semibold">장소 목록</span>
              <span className="bg-primary-light text-primary rounded-full px-2 py-0.5 text-[11px] font-bold">
                {pins.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {dayGroups.map(([dayNum, dayPins]) => (
                <div key={dayNum} className="flex items-center gap-0.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dayPins[0].color }} />
                  <span className="text-ink3 text-[10px]">D{dayNum}</span>
                </div>
              ))}
            </div>
          </div>
        </button>

        {/* 목록: 패널 높이에서 헤더 제외한 나머지를 스크롤 영역으로 */}
        {listOpen && (
          <div
            className="overflow-y-auto px-4 pt-2 pb-4"
            style={{ height: `calc(100% - ${PANEL_HEADER_H}px)` }}
          >
            {dayGroups.filter(([dayNum]) => selectedDay === null || dayNum === selectedDay).map(([dayNum, dayPins]) => (
              <div key={dayNum} className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                    style={{ backgroundColor: dayPins[0].color }}
                  >
                    Day {dayNum}
                  </span>
                  <span className="text-ink3 text-[11px]">{dayPins[0].dayDate}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {dayPins.map((pin) => {
                    const catInfo = getCategoryInfoByLabel(pin.categoryName ?? '')
                    const Icon = catInfo.icon
                    const isSelected = selectedPin?.id === pin.id
                    return (
                      <button
                        key={pin.id}
                        onClick={() => handlePinClick(pin)}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                          isSelected ? 'border-primary bg-primary-light' : 'border-border bg-white'
                        }`}
                      >
                        <div
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ backgroundColor: pin.color }}
                        >
                          {pin.orderIndex + 1}
                        </div>
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] ${catInfo.bg}`}>
                          <Icon size={18} className={catInfo.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[13px] font-semibold ${isSelected ? 'text-primary' : 'text-ink'}`}>
                            {pin.name}
                          </p>
                          {pin.address && (
                            <p className="text-ink3 mt-0.5 truncate text-[11px]">{pin.address}</p>
                          )}
                          <p className="mt-0.5 text-[11px] font-semibold" style={{ color: catInfo.hex }}>
                            {catInfo.hashLabel}
                          </p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-ink3 flex-shrink-0">
                          <path d="M7 1.5C4.8 1.5 3 3.3 3 5.5c0 2.8 4 7 4 7s4-4.2 4-7c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="1.3" />
                          <circle cx="7" cy="5.5" r="1.3" stroke="currentColor" strokeWidth="1.3" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

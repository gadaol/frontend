'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { getCategoryInfoByLabel } from '@/utils/placeCategory'
import type { TripDetail } from '../page'

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
}

const DAY_COLORS = ['#1B6FF0', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#DB2777']

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
}

export default function PlacesMapTab({ trip }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const [selectedPin, setSelectedPin] = useState<PlacePin | null>(null)
  const [listOpen, setListOpen] = useState(true)

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
              color: DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length],
              orderIndex: item.order_index,
              categoryName: item.places!.place_categories?.name ?? null,
            })),
        ),
    [trip.itinerary_days],
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

  // 일정에 장소 자체가 없는 경우에만 빈 상태 표시
  const hasAnyItems = trip.itinerary_days.some((d) => d.itinerary_items.length > 0)

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1B6FF0] border-t-transparent" />
      </div>
    )
  }

  if (!hasAnyItems) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#EBF2FF]">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path
              d="M15 3C10.5 3 6 7.05 6 12c0 6 9 15 9 15s9-9 9-15c0-4.95-4.05-9-9-9z"
              stroke="#1B6FF0"
              strokeWidth="2"
            />
            <circle cx="15" cy="12" r="3" stroke="#1B6FF0" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <p className="mb-1 text-[15px] font-semibold text-[#0F1117]">아직 장소가 없어요</p>
          <p className="text-[13px] text-[#9099A8]">일정에 장소를 추가하면 지도에 표시돼요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* 지도 — 고정 높이로 항상 표시 */}
      <div className="h-72 w-full">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={13}
          options={MAP_OPTIONS}
          onLoad={onLoad}
        >
          {pins.map((pin) => (
            <Marker
              key={pin.id}
              position={{ lat: pin.lat, lng: pin.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: selectedPin?.id === pin.id ? 13 : 10,
                fillColor: pin.color,
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
              }}
              label={{
                text: String(pin.orderIndex + 1),
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
              }}
              onClick={() => handlePinClick(pin)}
            />
          ))}
          {selectedPin && (
            <InfoWindow
              position={{ lat: selectedPin.lat, lng: selectedPin.lng }}
              onCloseClick={() => setSelectedPin(null)}
            >
              <div style={{ maxWidth: 160 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0F1117', marginBottom: 2 }}>
                  {selectedPin.name}
                </p>
                {selectedPin.address && (
                  <p style={{ fontSize: 11, color: '#9099A8' }}>{selectedPin.address}</p>
                )}
                <p style={{ fontSize: 11, color: selectedPin.color, marginTop: 4, fontWeight: 600 }}>
                  Day {selectedPin.dayNumber} · {selectedPin.orderIndex + 1}번째
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* 장소 목록 패널 */}
      <div className="bg-white">
        {/* 토글 핸들 */}
        <button
          onClick={() => setListOpen((v) => !v)}
          className="flex w-full items-center justify-between border-b border-[#F0F1F3] px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-[#0F1117]">장소 목록</span>
            <span className="rounded-full bg-[#EBF2FF] px-2 py-0.5 text-[11px] font-bold text-[#1B6FF0]">
              {pins.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Day 색상 범례 */}
            <div className="flex items-center gap-1.5">
              {dayGroups.map(([dayNum, dayPins]) => (
                <div key={dayNum} className="flex items-center gap-0.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: dayPins[0].color }}
                  />
                  <span className="text-[10px] text-[#9099A8]">D{dayNum}</span>
                </div>
              ))}
            </div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className={`transition-transform duration-300 ${listOpen ? '' : 'rotate-180'}`}
            >
              <path
                d="M4.5 11L9 6.5l4.5 4.5"
                stroke="#9099A8"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>

        {/* 리스트 (max-height 토글) */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: listOpen ? 2000 : 0 }}
        >
          <div className="px-4 pt-3 pb-6">
            {pins.length === 0 && (
              <p className="py-4 text-center text-[13px] text-[#9099A8]">
                장소 좌표가 없어 지도에 표시할 수 없어요
              </p>
            )}
            {dayGroups.map(([dayNum, dayPins]) => (
              <div key={dayNum} className="mb-4">
                {/* Day 헤더 */}
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                    style={{ backgroundColor: dayPins[0].color }}
                  >
                    Day {dayNum}
                  </span>
                  <span className="text-[11px] text-[#9099A8]">{dayPins[0].dayDate}</span>
                </div>

                {/* 장소 카드 */}
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
                          isSelected
                            ? 'border-[#1B6FF0] bg-[#EBF2FF]'
                            : 'border-[#E8EAED] bg-white'
                        }`}
                      >
                        <div
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ backgroundColor: pin.color }}
                        >
                          {pin.orderIndex + 1}
                        </div>
                        <div
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] ${catInfo.bg}`}
                        >
                          <Icon size={18} className={catInfo.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-[13px] font-semibold ${isSelected ? 'text-[#1B6FF0]' : 'text-[#0F1117]'}`}
                          >
                            {pin.name}
                          </p>
                          {pin.address && (
                            <p className="mt-0.5 truncate text-[11px] text-[#9099A8]">
                              {pin.address}
                            </p>
                          )}
                        </div>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          className="flex-shrink-0 text-[#9099A8]"
                        >
                          <path
                            d="M7 1.5C4.8 1.5 3 3.3 3 5.5c0 2.8 4 7 4 7s4-4.2 4-7c0-2.2-1.8-4-4-4z"
                            stroke="currentColor"
                            strokeWidth="1.3"
                          />
                          <circle cx="7" cy="5.5" r="1.3" stroke="currentColor" strokeWidth="1.3" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

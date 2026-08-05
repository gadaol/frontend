'use client'

import { useState, useCallback, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
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

// Day별 색상 (최대 7일)
const DAY_COLORS = [
  '#1B6FF0', '#7C3AED', '#059669', '#DC2626',
  '#D97706', '#0891B2', '#DB2777',
]

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
}

interface Props {
  trip: TripDetail
  locale: string
}

export default function PlacesMapTab({ trip, locale }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const [selectedPin, setSelectedPin] = useState<PlacePin | null>(null)

  // 모든 날짜의 장소를 핀 배열로 변환
  const pins: PlacePin[] = trip.itinerary_days
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
        })),
    )

  const center =
    pins.length > 0
      ? { lat: pins[0].lat, lng: pins[0].lng }
      : { lat: 37.5665, lng: 126.978 }

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    if (pins.length > 1) {
      const bounds = new window.google.maps.LatLngBounds()
      pins.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }))
      map.fitBounds(bounds, 60)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1B6FF0] border-t-transparent" />
      </div>
    )
  }

  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#EBF2FF]">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path d="M15 3C10.5 3 6 7.05 6 12c0 6 9 15 9 15s9-9 9-15c0-4.95-4.05-9-9-9z" stroke="#1B6FF0" strokeWidth="2" />
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
      {/* 지도 */}
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
                scale: 10,
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
              onClick={() => setSelectedPin(pin)}
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
                  Day {selectedPin.dayNumber}
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Day별 범례 + 장소 리스트 */}
      <div className="px-4 pt-4 pb-6">
        {/* Day 범례 */}
        <div className="mb-3 flex flex-wrap gap-2">
          {trip.itinerary_days
            .slice()
            .sort((a, b) => a.day_number - b.day_number)
            .filter((day) => day.itinerary_items.some((i) => i.places?.lat != null))
            .map((day) => (
              <div key={day.day_number} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length] }}
                />
                <span className="text-[12px] text-[#515966]">Day {day.day_number}</span>
              </div>
            ))}
        </div>

        {/* 장소 리스트 */}
        <div className="flex flex-col gap-2">
          {pins.map((pin) => (
            <button
              key={pin.id}
              onClick={() => {
                setSelectedPin(pin)
                mapRef.current?.panTo({ lat: pin.lat, lng: pin.lng })
              }}
              className="flex items-center gap-3 rounded-xl border border-[#E8EAED] bg-white px-3 py-3 text-left"
            >
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: pin.color }}
              >
                {pin.orderIndex + 1}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-[13px] font-semibold text-[#0F1117]">{pin.name}</p>
                {pin.address && (
                  <p className="truncate text-[11px] text-[#9099A8]">{pin.address}</p>
                )}
              </div>
              <span
                className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: pin.color }}
              >
                Day {pin.dayNumber}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

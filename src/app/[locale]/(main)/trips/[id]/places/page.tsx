'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/common/AppHeader'
import PlaceMapSearch from '@/components/features/places/PlaceMapSearch'
import { addItineraryItem } from '@/app/actions/trip'
import { getOrCreatePlace } from '@/app/actions/backlog'
import type { GooglePlace } from '@/types/place'

interface Props {
  params: Promise<{ id: string; locale: string }>
  searchParams: Promise<{ day?: string; date?: string }>
}

export default function TripPlacesPage({ params, searchParams }: Props) {
  const { id: tripId } = use(params)
  const { day, date } = use(searchParams)
  const router = useRouter()

  const dayNumber = parseInt(day ?? '1', 10)
  const dayDate = date ?? ''

  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())

  async function handleAdd(place: GooglePlace, e: React.MouseEvent) {
    e.stopPropagation()
    if (addedIds.has(place.id) || addingIds.has(place.id)) return

    setAddingIds((prev) => new Set(prev).add(place.id))

    const placeId = await getOrCreatePlace({
      googlePlaceId: place.id,
      name: place.displayName.text,
      address: place.formattedAddress,
      categoryName: place.types[0] ?? null,
    })

    if (placeId) {
      await addItineraryItem(tripId, dayDate, dayNumber, placeId)
      setAddedIds((prev) => new Set(prev).add(place.id))
    }

    setAddingIds((prev) => {
      const next = new Set(prev)
      next.delete(place.id)
      return next
    })
  }

  const headerTitle = dayDate
    ? `Day ${dayNumber} 장소 추가`
    : '장소 추가'

  return (
    <div className="flex h-full flex-col">
      <AppHeader title={headerTitle} onBack="router" />
      <div className="relative flex-1 overflow-hidden">
        <PlaceMapSearch
          renderListAction={(place) => {
            const isAdded = addedIds.has(place.id)
            const isAdding = addingIds.has(place.id)
            return (
              <button
                onClick={(e) => handleAdd(place, e)}
                disabled={isAdded || isAdding}
                className={`ml-1 flex h-9 flex-shrink-0 items-center justify-center rounded-full px-3 text-[12px] font-semibold transition-colors ${
                  isAdded
                    ? 'bg-primary/10 text-primary'
                    : 'bg-primary text-white disabled:opacity-50'
                }`}
              >
                {isAdding ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : isAdded ? (
                  '추가됨'
                ) : (
                  '추가'
                )}
              </button>
            )
          }}
          renderInfoCta={(place) => {
            const isAdded = addedIds.has(place.id)
            const isAdding = addingIds.has(place.id)
            return (
              <button
                onClick={(e) => handleAdd(place, e)}
                disabled={isAdded || isAdding}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 10,
                  padding: '7px 0 2px',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: isAdded ? '#9099A8' : '#1B6FF0',
                  background: 'none',
                  border: 'none',
                  borderTop: '1px solid #EEE',
                  cursor: isAdded ? 'default' : 'pointer',
                }}
              >
                {isAdding ? '추가 중...' : isAdded ? '추가됨 ✓' : '일정에 추가'}
              </button>
            )
          }}
        />
      </div>
    </div>
  )
}

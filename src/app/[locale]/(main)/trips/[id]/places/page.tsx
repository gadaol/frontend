'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/common/AppHeader'
import PlaceMapSearch from '@/components/features/places/PlaceMapSearch'
import { addItineraryItem } from '@/app/actions/trip'
import { getOrCreatePlace } from '@/app/actions/backlog'
import { addCandidatePlace } from '@/app/actions/candidate'
import { getDbCategory } from '@/utils/placeCategory'
import type { GooglePlace } from '@/types/place'

interface Props {
  params: Promise<{ id: string; locale: string }>
  searchParams: Promise<{ day?: string; date?: string }>
}

const BOTTOM_BAR_HEIGHT = 72

export default function TripPlacesPage({ params, searchParams }: Props) {
  const { id: tripId } = use(params)
  const { day, date } = use(searchParams)
  const router = useRouter()

  const isCandidate = !day
  const dayNumber = parseInt(day ?? '1', 10)
  const dayDate = date ?? ''

  // 선택된 장소 Map<googlePlaceId, GooglePlace>
  const [selected, setSelected] = useState<Map<string, GooglePlace>>(new Map())
  const [isSubmitting, setIsSubmitting] = useState(false)

  function toggleSelect(place: GooglePlace) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(place.id)) next.delete(place.id)
      else next.set(place.id, place)
      return next
    })
  }

  async function handleAddAll() {
    if (selected.size === 0 || isSubmitting) return
    setIsSubmitting(true)

    const places = Array.from(selected.values())

    await Promise.all(
      places.map(async (place) => {
        if (isCandidate) {
          await addCandidatePlace(
            tripId,
            place.id,
            place.displayName.text,
            place.formattedAddress,
            getDbCategory(place.types ?? []),
            place.location?.latitude ?? null,
            place.location?.longitude ?? null,
          )
        } else {
          const placeId = await getOrCreatePlace({
            googlePlaceId: place.id,
            name: place.displayName.text,
            address: place.formattedAddress,
            categoryName: getDbCategory(place.types ?? []),
            lat: place.location?.latitude ?? null,
            lng: place.location?.longitude ?? null,
          })
          if (placeId) {
            await addItineraryItem(tripId, dayDate, dayNumber, placeId)
          }
        }
      }),
    )

    router.back()
  }

  const headerTitle = isCandidate ? '후보 장소 추가' : `Day ${dayNumber} 장소 추가`
  const selectedCount = selected.size

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader title={headerTitle} onBack="router" />
      <div className="relative flex-1 overflow-hidden">
        <PlaceMapSearch
          bottomOffset={selectedCount > 0 ? BOTTOM_BAR_HEIGHT : 0}
          renderListAction={(place) => {
            const isSelected = selected.has(place.id)
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSelect(place)
                }}
                className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center"
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle
                    cx="11"
                    cy="11"
                    r="10"
                    fill={isSelected ? '#1B6FF0' : 'none'}
                    stroke={isSelected ? '#1B6FF0' : '#D0D3D9'}
                    strokeWidth="1.5"
                  />
                  {isSelected && (
                    <path
                      d="M6.5 11l3 3 6-6"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </button>
            )
          }}
          renderInfoCta={(place) => {
            const isSelected = selected.has(place.id)
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSelect(place)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 10,
                  padding: '7px 0 2px',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: isSelected ? '#059669' : '#1B6FF0',
                  background: 'none',
                  border: 'none',
                  borderTop: '1px solid #EEE',
                  cursor: 'pointer',
                }}
              >
                {isSelected ? '✓ 선택됨' : isCandidate ? '후보에 추가' : '일정에 추가'}
              </button>
            )
          }}
        />
      </div>

      {/* 하단 고정 추가 바 */}
      {selectedCount > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[#F0F1F3] bg-white px-4 pt-3 pb-8"
          style={{ height: BOTTOM_BAR_HEIGHT }}
        >
          <button
            onClick={handleAddAll}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B6FF0] py-3 text-[15px] font-bold text-white disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>추가 중...</span>
              </>
            ) : (
              <span>
                {isCandidate ? '후보' : `Day ${dayNumber}`}에{' '}
                <span className="rounded-full bg-white/20 px-2">{selectedCount}개</span> 추가
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

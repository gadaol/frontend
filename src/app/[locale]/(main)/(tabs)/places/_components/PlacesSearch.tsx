'use client'

import { useState } from 'react'
import { BacklogIcon } from '@/components/icons'
import { addToBacklog } from '@/app/actions/backlog'
import PlaceMapSearch from '@/components/features/places/PlaceMapSearch'
import { getDbCategory } from '@/utils/placeCategory'
import type { GooglePlace } from '@/types/place'

interface Props {
  initialAvatar?: string | null
  initialName?: string | null
}

export default function PlacesSearch({ initialAvatar, initialName }: Props) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  async function handleSave(place: GooglePlace, e: React.MouseEvent) {
    e.stopPropagation()
    if (savedIds.has(place.id) || savingIds.has(place.id)) return

    setSavingIds((prev) => new Set(prev).add(place.id))
    await addToBacklog({
      googlePlaceId: place.id,
      name: place.displayName.text,
      address: place.formattedAddress,
      categoryName: getDbCategory(place.types ?? []),
      lat: place.location?.latitude ?? null,
      lng: place.location?.longitude ?? null,
    })
    setSavedIds((prev) => new Set(prev).add(place.id))
    setSavingIds((prev) => {
      const next = new Set(prev)
      next.delete(place.id)
      return next
    })
  }

  return (
    <div style={{ height: 'calc(100dvh - 69px - env(safe-area-inset-bottom, 0px))' }}>
      <PlaceMapSearch
        initialAvatar={initialAvatar}
        initialName={initialName}
        renderListAction={(place) => {
          const isSaved = savedIds.has(place.id)
          const isSaving = savingIds.has(place.id)
          return (
            <button
              onClick={(e) => handleSave(place, e)}
              disabled={isSaved || isSaving}
              className="ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
            >
              {isSaving ? (
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              ) : (
                <BacklogIcon
                  size={20}
                  filled={isSaved}
                  className={isSaved ? 'text-primary' : 'text-[#C4C8CF]'}
                />
              )}
            </button>
          )
        }}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { BacklogIcon } from '@/components/icons'
import { addToBacklog } from '@/app/actions/backlog'
import PlaceMapSearch from '@/components/features/places/PlaceMapSearch'
import { getDbCategory } from '@/utils/placeCategory'
import type { GooglePlace } from '@/types/place'

export default function PlacesSearch() {
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
    })
    setSavedIds((prev) => new Set(prev).add(place.id))
    setSavingIds((prev) => {
      const next = new Set(prev)
      next.delete(place.id)
      return next
    })
  }

  return (
    <PlaceMapSearch
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
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1B6FF0] border-t-transparent" />
            ) : (
              <BacklogIcon
                size={20}
                filled={isSaved}
                className={isSaved ? 'text-[#1B6FF0]' : 'text-[#C4C8CF]'}
              />
            )}
          </button>
        )
      }}
    />
  )
}

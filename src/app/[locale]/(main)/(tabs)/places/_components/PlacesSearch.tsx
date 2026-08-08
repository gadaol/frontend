'use client'

import { useState } from 'react'
import { BacklogIcon } from '@/components/icons'
import { addToBacklog } from '@/app/actions/backlog'
import PlaceMapSearch from '@/components/features/places/PlaceMapSearch'
import { getDbCategory } from '@/utils/placeCategory'
import { useAssistantStore } from '@/lib/ai/store'
import type { GooglePlace } from '@/types/place'

interface Props {
  initialAvatar?: string | null
  initialName?: string | null
}

export default function PlacesSearch({ initialAvatar, initialName }: Props) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const openAssistant = useAssistantStore((s) => s.open)

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
    <PlaceMapSearch
      initialAvatar={initialAvatar}
      initialName={initialName}
      headerExtra={
        <button
          onClick={() => openAssistant({ prompt: '이 근처 가볼만한 장소를 추천해줘' })}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
          style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          <span>✨</span>
          <span>AI에게 물어보기</span>
        </button>
      }
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
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { backfillPlacesPhotos } from '@/app/actions/place-photo'

interface Props {
  googlePlaceIds: string[]
}

export default function PhotoBackfillTrigger({ googlePlaceIds }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (googlePlaceIds.length === 0) return
    backfillPlacesPhotos(googlePlaceIds).then(() => {
      router.refresh()
    })
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

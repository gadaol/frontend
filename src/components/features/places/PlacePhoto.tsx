'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'

interface CategoryStyle {
  bg: string
  color: string
  icon: ComponentType<{ size?: number; className?: string }>
}

interface Props {
  photoRef: string | null | undefined
  categoryStyle: CategoryStyle
  iconSize?: number
  className?: string
  imgClassName?: string
}

export default function PlacePhoto({
  photoRef,
  categoryStyle,
  iconSize = 22,
  className = '',
  imgClassName = 'absolute inset-0 h-full w-full object-cover',
}: Props) {
  const [failed, setFailed] = useState(false)
  const { bg, color, icon: Icon } = categoryStyle

  if (photoRef && !failed) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/places/photo?ref=${encodeURIComponent(photoRef)}`}
          alt=""
          className={imgClassName}
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${bg} ${className}`}>
      <Icon size={iconSize} className={color} />
    </div>
  )
}

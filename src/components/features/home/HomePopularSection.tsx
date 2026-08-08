'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import DestinationSheet from './DestinationSheet'

const POPULAR = [
  {
    id: 'jeju',
    name: '제주도', nameEn: 'Jeju',
    region: '대한민국', regionEn: 'Korea',
    photoId: '1553064926-08ea5c897765',
    gradient: 'linear-gradient(145deg, #0096c7 0%, #00b4d8 100%)',
    searchQuery: '제주도 관광명소',
  },
  {
    id: 'tokyo',
    name: '도쿄', nameEn: 'Tokyo',
    region: '일본', regionEn: 'Japan',
    photoId: '1540959733332-eab4deabeeaf',
    gradient: 'linear-gradient(145deg, #2d3561 0%, #c05c7e 100%)',
    searchQuery: '도쿄 관광명소',
  },
  {
    id: 'bangkok',
    name: '방콕', nameEn: 'Bangkok',
    region: '태국', regionEn: 'Thailand',
    photoId: '1508009603885-50cf7c579365',
    gradient: 'linear-gradient(145deg, #c0392b 0%, #e67e22 100%)',
    searchQuery: '방콕 관광명소',
  },
  {
    id: 'paris',
    name: '파리', nameEn: 'Paris',
    region: '프랑스', regionEn: 'France',
    photoId: '1431274172761-fca41d930114',
    gradient: 'linear-gradient(145deg, #2c3e7a 0%, #8e44ad 100%)',
    searchQuery: '파리 관광명소',
  },
  {
    id: 'bali',
    name: '발리', nameEn: 'Bali',
    region: '인도네시아', regionEn: 'Indonesia',
    photoId: '1537996194471-e657df975ab4',
    gradient: 'linear-gradient(145deg, #2d6a4f 0%, #95d5b2 100%)',
    searchQuery: '발리 관광명소',
  },
  {
    id: 'newyork',
    name: '뉴욕', nameEn: 'New York',
    region: '미국', regionEn: 'USA',
    photoId: '1496442226666-8d4d0e62e6e9',
    gradient: 'linear-gradient(145deg, #1c2841 0%, #4a90d9 100%)',
    searchQuery: '뉴욕 관광명소',
  },
]

type Dest = typeof POPULAR[number]

export default function HomePopularSection() {
  const locale = useLocale()
  const isKo = locale === 'ko'
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Dest | null>(null)

  function handleImgError(id: string) {
    setErrorIds((prev) => new Set(prev).add(id))
  }

  return (
    <>
      <div>
        <p className="text-ink mb-3 text-[15px] font-semibold">
          {isKo ? '추천 여행지' : 'Popular Destinations'}
        </p>

        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
          {POPULAR.map((dest) => {
            const imgUrl = `https://images.unsplash.com/photo-${dest.photoId}?w=240&h=240&fit=crop&q=80`
            const imgFailed = errorIds.has(dest.id)

            return (
              <button
                key={dest.id}
                onClick={() => setSelected(dest)}
                className="relative flex-shrink-0 overflow-hidden rounded-2xl text-left"
                style={{ width: 112, height: 112 }}
              >
                {/* 그라디언트 항상 베이스 */}
                <div className="absolute inset-0" style={{ background: dest.gradient }} />

                {/* 사진: 로드 성공 시 덮음 */}
                {!imgFailed && (
                  <Image
                    src={imgUrl}
                    alt={isKo ? dest.name : dest.nameEn}
                    fill
                    className="object-cover"
                    sizes="112px"
                    onError={() => handleImgError(dest.id)}
                  />
                )}

                {/* 하단 오버레이: 사진 있을 때만 */}
                {!imgFailed && (
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }}
                  />
                )}

                {/* 텍스트 */}
                <div className={`absolute bottom-0 left-0 p-2.5 ${imgFailed ? 'w-full' : ''}`}>
                  <p className={`text-[10px] font-medium ${imgFailed ? 'text-white/80' : 'text-white/70'}`}>
                    {isKo ? dest.region : dest.regionEn}
                  </p>
                  <p className="text-[13px] font-bold text-white leading-tight">
                    {isKo ? dest.name : dest.nameEn}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 여행지 바텀 시트 */}
      <DestinationSheet
        destination={
          selected
            ? {
                name: isKo ? selected.name : selected.nameEn,
                nameEn: selected.nameEn,
                searchQuery: selected.searchQuery,
                gradient: selected.gradient,
              }
            : null
        }
        onClose={() => setSelected(null)}
      />
    </>
  )
}

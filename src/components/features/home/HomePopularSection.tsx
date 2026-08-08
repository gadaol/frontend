'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import DestinationSheet from './DestinationSheet'
import { MapPinIcon } from '@/components/icons'
import { findDestination, destinationPhotoUrl, FALLBACK_GRADIENTS } from '@/lib/destinations'

const TOTAL = 6
/** 집계 데이터가 아무리 많아도 AI 추천은 최소 이만큼 노출한다 */
const AI_MIN = 2
/** AI 카드가 놓이는 자리 — 처음부터 몰리지 않게 중간과 끝에 배치 */
const AI_POSITIONS = [2, 5, 1, 4, 0, 3]

interface DestinationItem {
  name: string
  count: number
}
interface Props {
  popularDestinations: DestinationItem[]
}

type Dest = {
  id: string
  name: string
  nameEn: string
  region: string
  regionEn: string
  photoId: string | null
  gradient: string
  searchQuery: string
  count: number
  isAI: boolean
  hasKnown: boolean
}

function toDestCard(name: string, count: number, idx: number, isAI: boolean): Dest {
  const k = findDestination(name)
  return {
    id: name,
    name,
    nameEn: k?.en ?? name,
    region: k?.regionKo ?? '',
    regionEn: k?.regionEn ?? '',
    photoId: k?.photoId ?? null,
    gradient: k?.gradient ?? FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length],
    searchQuery: `${name} 관광명소`,
    count,
    isAI,
    hasKnown: !!k,
  }
}

/**
 * 가다로그 집계 카드 사이사이에 AI 카드를 끼워 넣는다.
 * 앞줄이 전부 집계 데이터로 채워져 AI가 스크롤 밖으로 밀리는 걸 막는 게 목적.
 */
function interleave(dbCards: Dest[], aiCards: Dest[]): Dest[] {
  if (aiCards.length === 0) return dbCards

  const slots = new Array<Dest | null>(dbCards.length + aiCards.length).fill(null)
  const aiSpots = AI_POSITIONS.filter((p) => p < slots.length).slice(0, aiCards.length)

  aiSpots.forEach((pos, i) => {
    slots[pos] = aiCards[i]
  })

  const rest = [...dbCards]
  for (let i = 0; i < slots.length; i++) {
    if (!slots[i]) slots[i] = rest.shift() ?? null
  }
  return slots.filter((c): c is Dest => c !== null)
}

export default function HomePopularSection({ popularDestinations }: Props) {
  const locale = useLocale()
  const isKo = locale === 'ko'
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Dest | null>(null)
  const [aiDests, setAiDests] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [dynamicRefs, setDynamicRefs] = useState<Record<string, string>>({})
  const fetchedRef = useRef<Set<string>>(new Set())

  // 가다로그 집계가 6개를 다 채우더라도 AI 추천이 아예 안 보이면 안 되므로
  // 최소 자리수를 떼어둔다. 나머지는 인기순 집계가 채운다.
  const aiSlots = Math.max(AI_MIN, TOTAL - popularDestinations.length)
  const dbCards = popularDestinations
    .slice(0, TOTAL - aiSlots)
    .map((d, i) => toDestCard(d.name, d.count, i, false))

  const existingNames = dbCards.map((d) => d.name)

  // 마운트 직후 한 번만 AI 추천을 받아온다.
  useEffect(() => {
    // 로딩 플래그는 요청 시작과 동시에 켜야 스켈레톤이 제때 뜬다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAiLoading(true)
    fetch('/api/ai/destinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale, count: aiSlots, exclude: existingNames }),
    })
      .then((r) => r.json())
      .then((data) => setAiDests(data.destinations ?? []))
      .catch(() => {})
      .finally(() => setAiLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const aiCards = aiDests
    .filter((n) => !existingNames.includes(n))
    .slice(0, aiSlots)
    .map((n, i) => toDestCard(n, 0, dbCards.length + i, true))

  const allCards = interleave(dbCards, aiCards)
  const skeletonCount = aiSlots - aiCards.length

  // KNOWN에 없는 목적지는 Google Places API에서 사진 ref 가져오기
  useEffect(() => {
    const unknown = allCards.filter((c) => !c.hasKnown && !fetchedRef.current.has(c.id))
    if (unknown.length === 0) return
    unknown.forEach((c) => fetchedRef.current.add(c.id))
    unknown.forEach(async (c) => {
      try {
        const res = await fetch(`/api/places/destination?q=${encodeURIComponent(c.name)}`)
        const data = await res.json()
        const ref = data.places?.[0]?.photoRef
        if (ref) setDynamicRefs((p) => ({ ...p, [c.id]: ref }))
      } catch {}
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards.map((c) => c.id).join(',')])

  return (
    <>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-ink text-[15px] font-semibold">
            {isKo ? '추천 여행지' : 'Popular Destinations'}
          </p>
          <p className="text-ink3 text-[11px]">{isKo ? '가다로그 + AI' : 'App + AI'}</p>
        </div>

        <div
          className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {allCards.map((dest) => {
            const dynamicRef = dynamicRefs[dest.id]
            const imgUrl = dest.photoId
              ? destinationPhotoUrl(dest.photoId, 240)
              : dynamicRef
                ? `/api/places/photo?ref=${encodeURIComponent(dynamicRef)}`
                : null
            const imgFailed = errorIds.has(dest.id)

            return (
              <button
                key={dest.id}
                onClick={() => setSelected(dest)}
                className="relative flex-shrink-0 overflow-hidden rounded-2xl text-left active:opacity-90"
                style={{ width: 112, height: 112 }}
              >
                <div className="absolute inset-0" style={{ background: dest.gradient }} />
                {(!imgUrl || imgFailed) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPinIcon size={28} className="text-white/40" />
                  </div>
                )}
                {imgUrl && !imgFailed && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl}
                    alt={isKo ? dest.name : dest.nameEn}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={() => setErrorIds((p) => new Set(p).add(dest.id))}
                  />
                )}
                {imgUrl && !imgFailed && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 55%)',
                    }}
                  />
                )}
                <div className="absolute bottom-0 left-0 p-2.5">
                  {dest.region && (
                    <p className="text-[10px] font-medium text-white/70">
                      {isKo ? dest.region : dest.regionEn}
                    </p>
                  )}
                  <p className="text-[13px] leading-tight font-bold text-white">
                    {isKo ? dest.name : dest.nameEn}
                  </p>
                  {dest.count > 0 && (
                    <p className="mt-0.5 text-[10px] text-white/60">{dest.count}개 여행</p>
                  )}
                </div>
                {dest.isAI && (
                  <div className="absolute top-2 right-2 rounded-full bg-black/30 px-1.5 py-0.5 text-[9px] font-semibold text-white/80 backdrop-blur-sm">
                    AI
                  </div>
                )}
              </button>
            )
          })}

          {/* AI 로딩 중 스켈레톤 */}
          {aiLoading &&
            skeletonCount > 0 &&
            Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-bg2 relative flex-shrink-0 overflow-hidden rounded-2xl"
                style={{ width: 112, height: 112 }}
              >
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
              </div>
            ))}
        </div>
      </div>

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

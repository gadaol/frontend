'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import dayjs from '@/lib/dayjs'
import { getCategoryInfoByLabel } from '@/utils/placeCategory'
import PlacePhoto from '@/components/features/places/PlacePhoto'
import PhotoBackfillTrigger from '@/components/features/places/PhotoBackfillTrigger'
import { toggleVote } from '@/app/actions/vote'
import { removeCandidatePlace, confirmCandidateToDay } from '@/app/actions/candidate'
import type { VoteRecord } from '../../page'
import type { CandidatePlace } from '../page'

type ExpectedDay = { dayNumber: number; dayDate: string }

interface Props {
  tripId: string
  tripTitle: string
  startDate: string | null
  endDate: string | null
  candidates: CandidatePlace[]
  initialVotes: VoteRecord
  currentUserId: string
}

export default function VoteClient({
  tripId,
  tripTitle,
  startDate,
  endDate,
  candidates: initialCandidates,
  initialVotes,
}: Props) {
  const locale = useLocale()
  const router = useRouter()
  const [votes, setVotes] = useState<VoteRecord>(initialVotes)
  const [candidates, setCandidates] = useState<CandidatePlace[]>(initialCandidates)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [openDayPickerId, setOpenDayPickerId] = useState<string | null>(null)

  const expectedDays = useMemo<ExpectedDay[]>(() => {
    if (!startDate || !endDate) return []
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    const numDays = end.diff(start, 'day') + 1
    return Array.from({ length: numDays }, (_, i) => ({
      dayNumber: i + 1,
      dayDate: start.add(i, 'day').format('YYYY-MM-DD'),
    }))
  }, [startDate, endDate])

  function handleVote(placeId: string, voteType: 'like' | 'dislike') {
    setVotes((prev) => {
      const cur = prev[placeId] ?? { likes: 0, dislikes: 0, myVote: null }
      const next = { ...cur }
      if (cur.myVote === voteType) {
        next.myVote = null
        if (voteType === 'like') next.likes--
        else next.dislikes--
      } else {
        if (cur.myVote === 'like') next.likes--
        if (cur.myVote === 'dislike') next.dislikes--
        next.myVote = voteType
        if (voteType === 'like') next.likes++
        else next.dislikes++
      }
      return { ...prev, [placeId]: next }
    })
    toggleVote(tripId, placeId, voteType)
  }

  async function handleRemove(candidateId: string, placeId: string) {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId))
    await removeCandidatePlace(tripId, placeId)
  }

  async function handleConfirm(candidate: CandidatePlace, day: ExpectedDay) {
    setConfirmingId(candidate.id)
    const result = await confirmCandidateToDay(
      tripId,
      candidate.place_id,
      day.dayDate,
      day.dayNumber,
    )
    if (!result.error) {
      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id))
      setOpenDayPickerId(null)
    }
    setConfirmingId(null)
    router.refresh()
  }

  const backfillIds = initialCandidates
    .filter((c) => c.places && !c.places.photo_ref && c.places.google_place_id)
    .map((c) => c.places!.google_place_id!)
    .slice(0, 10)

  return (
    <div className="bg-bg2 flex min-h-dvh flex-col">
      <PhotoBackfillTrigger googlePlaceIds={backfillIds} />
      {/* 헤더 */}
      <div className="border-border sticky top-0 z-20 flex h-[54px] items-center gap-3 border-b bg-white px-4">
        <button
          onClick={() => router.back()}
          className="bg-bg2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11 4L6 9l5 5"
              stroke="var(--color-ink)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-ink3 text-[11px]">{tripTitle}</p>
          <h1 className="text-ink text-[17px] font-bold">후보 장소 투표</h1>
        </div>
        <Link
          href={`/${locale}/trips/${tripId}/places`}
          className="bg-primary flex h-9 items-center gap-1 rounded-full px-3.5 text-[13px] font-semibold text-white"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          후보 추가
        </Link>
      </div>

      {/* 안내 배너 */}
      <div className="bg-primary-light mx-4 mt-4 rounded-2xl px-4 py-3">
        <p className="text-primary text-[13px] font-medium">
          👍 좋아요가 많은 장소를 일정에 추가해보세요
        </p>
        <p className="mt-0.5 text-[11px] text-[#4A8AF4]">
          투표 후 원하는 날짜에 바로 확정할 수 있어요
        </p>
      </div>

      {/* 후보 리스트 */}
      <div className="flex-1 px-4 pt-3 pb-8">
        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="bg-primary-light flex h-16 w-16 items-center justify-center rounded-[20px]">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 8v8M16 20v2"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="16" cy="16" r="13" stroke="var(--color-primary)" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <p className="text-ink mb-1 text-[16px] font-semibold">후보 장소가 없어요</p>
              <p className="text-ink3 text-[13px]">장소를 검색해서 후보에 추가해보세요</p>
            </div>
            <Link
              href={`/${locale}/trips/${tripId}/places`}
              className="bg-primary mt-1 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
            >
              후보 장소 추가하기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {candidates.map((candidate) => {
              const place = candidate.places
              if (!place) return null
              const catLabel = place.place_categories?.name ?? '기타'
              const category = getCategoryInfoByLabel(catLabel)
              const voteEntry = votes[candidate.place_id] ?? { likes: 0, dislikes: 0, myVote: null }
              const isPickingDay = openDayPickerId === candidate.id
              const isConfirming = confirmingId === candidate.id

              return (
                <div key={candidate.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  {/* 장소 정보 */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <PlacePhoto
                      photoRef={place.photo_ref}
                      categoryStyle={category}
                      iconSize={22}
                      className="h-11 w-11 flex-shrink-0 rounded-[12px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-ink text-[15px] leading-snug font-semibold">
                        {place.name}
                      </p>
                      {place.address && (
                        <p className="text-ink3 mt-0.5 truncate text-[12px]">{place.address}</p>
                      )}
                      <p
                        className="mt-0.5 text-[11px] font-semibold"
                        style={{ color: category.hex }}
                      >
                        {category.hashLabel}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(candidate.id, candidate.place_id)}
                      className="bg-bg2 text-ink3 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 2l8 8M10 2l-8 8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 투표 버튼 */}
                  <div className="border-bg2 flex gap-2 border-t px-4 py-3">
                    <button
                      onClick={() => handleVote(candidate.place_id, 'like')}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold transition-colors ${
                        voteEntry.myVote === 'like'
                          ? 'bg-primary-light text-primary'
                          : 'bg-bg2 text-ink2'
                      }`}
                    >
                      <span className="text-[18px]">👍</span>
                      <span>{voteEntry.likes}</span>
                    </button>
                    <button
                      onClick={() => handleVote(candidate.place_id, 'dislike')}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold transition-colors ${
                        voteEntry.myVote === 'dislike'
                          ? 'bg-error-light text-error'
                          : 'bg-bg2 text-ink2'
                      }`}
                    >
                      <span className="text-[18px]">👎</span>
                      <span>{voteEntry.dislikes}</span>
                    </button>
                  </div>

                  {/* 일정 확정 영역 */}
                  {expectedDays.length > 0 && (
                    <div className="border-bg2 border-t px-4 pt-2 pb-4">
                      {isPickingDay ? (
                        <div>
                          <p className="text-ink2 mb-2 text-[12px] font-medium">
                            어느 날에 추가할까요?
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {expectedDays.map((day) => (
                              <button
                                key={day.dayDate}
                                disabled={isConfirming}
                                onClick={() => handleConfirm(candidate, day)}
                                className="border-primary text-primary flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50"
                              >
                                {isConfirming ? (
                                  <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
                                ) : (
                                  <>
                                    <span>Day {day.dayNumber}</span>
                                    <span className="text-ink3">
                                      {dayjs(day.dayDate).format('M/D')}
                                    </span>
                                  </>
                                )}
                              </button>
                            ))}
                            <button
                              onClick={() => setOpenDayPickerId(null)}
                              className="border-border text-ink3 rounded-full border px-3 py-1.5 text-[12px]"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setOpenDayPickerId(candidate.id)}
                          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold ${
                            voteEntry.likes > voteEntry.dislikes
                              ? 'bg-primary text-white'
                              : 'border-border text-ink3 border'
                          }`}
                        >
                          {voteEntry.likes > voteEntry.dislikes && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path
                                d="M2.5 7l3.5 3.5 5.5-6"
                                stroke="white"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                          일정에 추가
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

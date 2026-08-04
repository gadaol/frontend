'use client'

import React, { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import dayjs from '@/lib/dayjs'
import { ChevronLeftIcon, MapPinIcon, PlusIcon } from '@/components/icons'
import { getCategoryInfoByLabel } from '@/utils/placeCategory'
import { formatDateRange, daysUntil, isTripOngoing, isTripUpcoming, tripDuration } from '@/utils/date'
import { removeItineraryItem } from '@/app/actions/trip'
import type { TripDetail, MemberProfile } from '../page'

const AVATAR_COLORS = ['#1B6FF0', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2']

interface Props {
  trip: TripDetail
  memberProfiles: MemberProfile[]
  currentUserId: string
}

export default function TripDetailClient({ trip, memberProfiles, currentUserId }: Props) {
  const locale = useLocale()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [removedItemIds, setRemovedItemIds] = useState<Set<string>>(new Set())

  const profileMap = new Map(memberProfiles.map((p) => [p.id, p.name]))

  // Day 목록 생성 (start ~ end)
  const expectedDays = useMemo(() => {
    if (!trip.start_date || !trip.end_date) return []
    const start = dayjs(trip.start_date)
    const end = dayjs(trip.end_date)
    const numDays = end.diff(start, 'day') + 1
    return Array.from({ length: numDays }, (_, i) => ({
      dayNumber: i + 1,
      dayDate: start.add(i, 'day').format('YYYY-MM-DD'),
    }))
  }, [trip.start_date, trip.end_date])

  const [activeDay, setActiveDay] = useState(1)

  // DB itinerary_days를 날짜 키로 매핑
  const dayMap = useMemo(
    () => new Map(trip.itinerary_days.map((d) => [d.day_date, d])),
    [trip.itinerary_days],
  )

  const activeDayInfo = expectedDays.find((d) => d.dayNumber === activeDay)
  const activeDayDB = activeDayInfo ? dayMap.get(activeDayInfo.dayDate) : null
  const activeItems = useMemo(
    () =>
      (activeDayDB?.itinerary_items ?? [])
        .filter((item) => !removedItemIds.has(item.id))
        .sort((a, b) => a.order_index - b.order_index),
    [activeDayDB, removedItemIds],
  )

  function handleRemoveItem(itemId: string) {
    setRemovedItemIds((prev) => new Set(prev).add(itemId))
    startTransition(async () => {
      await removeItineraryItem(itemId)
      router.refresh()
    })
  }

  // 상태 표시
  const ongoing = isTripOngoing(trip.start_date, trip.end_date)
  const upcoming = isTripUpcoming(trip.start_date)
  const numDays = tripDuration(trip.start_date, trip.end_date)
  const nights = numDays - 1

  const statusLabel = ongoing
    ? '여행 중'
    : upcoming
      ? `D-${daysUntil(trip.start_date)}`
      : trip.start_date
        ? '완료'
        : '날짜 미정'

  const durationLabel =
    numDays === 1
      ? '당일치기'
      : trip.start_date
        ? `${nights}박 ${numDays}일`
        : ''

  const isOwner = trip.owner_id === currentUserId

  return (
    <div className="bg-bg2 flex min-h-full flex-col">
      {/* 히어로 커버 */}
      <div
        className="relative h-52 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #0c1f45, #1B6FF0)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.1) 60%, transparent 100%)',
          }}
        />
        {/* 상단 버튼 */}
        <div className="absolute top-12 right-3 left-3 z-10 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm"
          >
            <ChevronLeftIcon size={20} className="text-white" />
          </button>
          {isOwner && (
            <Link
              href={`/${locale}/trips/${trip.id}/edit`}
              className="flex h-9 items-center justify-center rounded-full border border-white/20 bg-black/30 px-3.5 backdrop-blur-sm text-[13px] font-medium text-white"
            >
              편집
            </Link>
          )}
        </div>
        {/* 하단 정보 */}
        <div className="absolute right-0 bottom-0 left-0 z-10 px-4 pb-4">
          {/* 상태 뱃지 */}
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 backdrop-blur-sm">
            {ongoing && (
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            )}
            <span className="text-[11px] font-semibold text-white">{statusLabel}</span>
          </div>
          <h1 className="mb-1 text-[22px] font-bold tracking-tight text-white leading-tight">
            {trip.title}
          </h1>
          <p className="text-[13px] text-white/70">
            {trip.start_date
              ? `${formatDateRange(trip.start_date, trip.end_date, locale)}${durationLabel ? ` · ${durationLabel}` : ''}`
              : '날짜 미정'}
          </p>
        </div>
      </div>

      {/* 멤버 섹션 */}
      <div className="border-border bg-bg flex items-center gap-3 border-b px-4 py-3">
        <div className="flex">
          {trip.trip_members.slice(0, 5).map((m, i) => {
            const name = profileMap.get(m.user_id) ?? '?'
            return (
              <div
                key={m.user_id}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white"
                style={{
                  backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  marginLeft: i > 0 ? -8 : 0,
                  zIndex: trip.trip_members.length - i,
                  position: 'relative',
                }}
              >
                {name[0]}
              </div>
            )
          })}
        </div>
        <span className="text-ink2 text-[13px]">
          {trip.trip_members.length}명
        </span>
        <Link
          href={`/${locale}/trips/${trip.id}/invite`}
          className="border-border ml-auto flex h-8 items-center gap-1.5 rounded-full border bg-white px-3 text-[12px] font-medium text-[#515966]"
        >
          <PlusIcon size={14} className="text-[#515966]" />
          메이트 초대
        </Link>
      </div>

      {/* 일정 섹션 */}
      <div className="flex flex-1 flex-col">
        {expectedDays.length === 0 ? (
          /* 날짜 미설정 상태 */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-20 text-center">
            <div className="bg-primary-light flex h-20 w-20 items-center justify-center rounded-[24px]">
              <MapPinIcon size={36} className="text-primary" />
            </div>
            <div>
              <p className="text-ink mb-1 text-[16px] font-semibold">일정이 없어요</p>
              <p className="text-ink3 text-[13px] leading-relaxed">
                여행 날짜를 설정하면 일정을 관리할 수 있어요
              </p>
            </div>
            {isOwner && (
              <Link
                href={`/${locale}/trips/${trip.id}/edit`}
                className="bg-primary mt-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
              >
                날짜 설정하기
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Day 탭 */}
            <div className="border-border bg-bg sticky top-0 z-10 border-b">
              <div
                className="flex gap-1 overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none' } as React.CSSProperties}
              >
                {expectedDays.map((day) => (
                  <button
                    key={day.dayNumber}
                    onClick={() => setActiveDay(day.dayNumber)}
                    className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                      activeDay === day.dayNumber
                        ? 'bg-primary text-white'
                        : 'border-border border bg-white text-[#515966]'
                    }`}
                  >
                    Day {day.dayNumber}
                  </button>
                ))}
              </div>
              {activeDayInfo && (
                <p className="text-ink3 px-4 pb-2.5 text-[12px]">
                  {dayjs(activeDayInfo.dayDate).locale(locale).format('M월 D일 (ddd)')}
                </p>
              )}
            </div>

            {/* 아이템 리스트 */}
            <div className="flex flex-1 flex-col gap-2.5 px-4 py-4">
              {activeItems.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                  <p className="text-ink3 text-[14px]">이 날 일정이 없어요</p>
                  <Link
                    href={`/${locale}/trips/${trip.id}/places?day=${activeDay}&date=${activeDayInfo?.dayDate ?? ''}`}
                    className="border-primary text-primary flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold"
                  >
                    <PlusIcon size={14} className="text-primary" />
                    장소 추가
                  </Link>
                </div>
              ) : (
                <>
                  {activeItems.map((item, idx) => {
                    const catLabel = item.places?.place_categories?.name ?? '기타'
                    const category = getCategoryInfoByLabel(catLabel)
                    const Icon = category.icon
                    const placeHref = item.places?.google_place_id
                      ? `/${locale}/places/${item.places.google_place_id}`
                      : null

                    return (
                      <div key={item.id} className="flex items-start gap-3">
                        {/* 순서 인디케이터 */}
                        <div className="flex flex-col items-center pt-1">
                          <div className="bg-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
                            {idx + 1}
                          </div>
                          {idx < activeItems.length - 1 && (
                            <div className="bg-border mt-1 h-full w-px" style={{ minHeight: 32 }} />
                          )}
                        </div>
                        {/* 카드 */}
                        <div className="border-border bg-bg mb-2 flex flex-1 overflow-hidden rounded-2xl border">
                          {/* 카테고리 아이콘 썸네일 */}
                          <div
                            className={`flex w-16 flex-shrink-0 items-center justify-center ${category.bg}`}
                          >
                            <Icon size={24} className={category.color} />
                          </div>
                          {/* 본문 */}
                          <div className="flex-1 px-3 py-3">
                            {item.visit_time && (
                              <p className="text-primary mb-0.5 text-[11px] font-semibold">
                                {item.visit_time.slice(0, 5)}
                              </p>
                            )}
                            <p className="text-ink truncate text-[14px] font-bold">
                              {item.places?.name ?? '알 수 없는 장소'}
                            </p>
                            {item.places?.address && (
                              <p className="text-ink3 truncate text-[11px]">{item.places.address}</p>
                            )}
                            {item.memo && (
                              <p className="text-ink2 mt-1 truncate text-[11px] italic">
                                &ldquo;{item.memo}&rdquo;
                              </p>
                            )}
                          </div>
                          {/* 삭제 버튼 */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="flex w-10 flex-shrink-0 items-center justify-center self-stretch text-[#9099A8] active:opacity-50"
                            aria-label="일정에서 제거"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                          {placeHref && (
                            <Link
                              href={placeHref}
                              className="flex w-8 flex-shrink-0 items-center justify-center self-stretch text-[#9099A8]"
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M5.5 3.5l3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* + 장소 추가 버튼 */}
                  <Link
                    href={`/${locale}/trips/${trip.id}/places?day=${activeDay}&date=${activeDayInfo?.dayDate ?? ''}`}
                    className="border-border mt-1 flex items-center justify-center gap-1.5 rounded-2xl border border-dashed py-4 text-[13px] font-medium text-[#9099A8]"
                  >
                    <PlusIcon size={16} className="text-[#9099A8]" />
                    장소 추가
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

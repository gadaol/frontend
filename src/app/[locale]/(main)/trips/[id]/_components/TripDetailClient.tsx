'use client'

import React, { useState, useMemo, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import dayjs from '@/lib/dayjs'
import { MapPinIcon, PlusIcon } from '@/components/icons'
import PlacesMapTab from './PlacesMapTab'
import { getCategoryInfoByLabel } from '@/utils/placeCategory'
import {
  formatDateRange,
  daysUntil,
  isTripOngoing,
  isTripUpcoming,
  tripDuration,
} from '@/utils/date'
import { removeItineraryItem, updateItineraryItemTime } from '@/app/actions/trip'
import { getOrCreateInviteToken } from '@/app/actions/invite'
import type { TripDetail, MemberProfile } from '../page'

const AVATAR_COLORS = ['#1B6FF0', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2']

type Tab = '일정' | '장소' | '메이트'

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
  const [activeTab, setActiveTab] = useState<Tab>('일정')
  const [copyToast, setCopyToast] = useState(false)
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleInvite() {
    const token = await getOrCreateInviteToken(trip.id)
    if (!token) return
    const inviteUrl = `${window.location.origin}/${locale}/trips/${trip.id}/join?token=${token}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `${trip.title} 여행에 초대합니다`, url: inviteUrl })
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          await navigator.clipboard.writeText(inviteUrl).catch(() => null)
          showCopyToast()
        }
      }
    } else {
      await navigator.clipboard.writeText(inviteUrl).catch(() => null)
      showCopyToast()
    }
  }

  function showCopyToast() {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setCopyToast(true)
    toastTimer.current = setTimeout(() => setCopyToast(false), 2500)
  }

  const profileMap = new Map(memberProfiles.map((p) => [p.id, p.name]))

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

  const dayMap = useMemo(
    () => new Map(trip.itinerary_days.map((d) => [d.day_date, d])),
    [trip.itinerary_days],
  )

  function handleRemoveItem(itemId: string) {
    setRemovedItemIds((prev) => new Set(prev).add(itemId))
    startTransition(async () => {
      await removeItineraryItem(itemId)
      router.refresh()
    })
  }

  function handleTimeChange(itemId: string, time: string) {
    startTransition(async () => {
      await updateItineraryItemTime(itemId, time || null)
      router.refresh()
    })
  }

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
    numDays === 1 ? '당일치기' : trip.start_date ? `${nights}박 ${numDays}일` : ''

  const isOwner = trip.owner_id === currentUserId

  return (
    <div className="flex min-h-full flex-col bg-[#F5F7FA]">
      {copyToast && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#0F1117] px-4 py-2 text-[13px] font-medium text-white shadow-lg">
          초대 링크가 복사됐어요
        </div>
      )}

      {/* 커버 */}
      <div
        className="relative h-[220px] flex-shrink-0"
        style={{
          background:
            trip.cover_url ?? 'linear-gradient(160deg,#070E1A 0%,#1B6FF0 70%,#0F2351 100%)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.5))' }}
        />
        {/* 상단 버튼 */}
        <button
          onClick={() => router.back()}
          className="absolute top-[52px] left-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11 4L6 9l5 5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="absolute top-[52px] right-4 flex gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="5" cy="9" r="1.5" fill="white" />
              <circle cx="9" cy="9" r="1.5" fill="white" />
              <circle cx="13" cy="9" r="1.5" fill="white" />
            </svg>
          </button>
        </div>
        {/* 하단 정보 */}
        <div className="absolute right-4 bottom-4 left-4">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
            {ongoing && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />}
            <span className="text-[11px] font-semibold text-white">{statusLabel}</span>
          </div>
          <h1 className="mb-1 text-[24px] font-extrabold tracking-tight text-white">
            {trip.title}
          </h1>
          {trip.destination && (
            <div className="mb-0.5 flex items-center gap-1">
              <MapPinIcon size={12} className="text-white/60" />
              <span className="text-[12px] text-white/70">{trip.destination}</span>
            </div>
          )}
          <p className="text-[13px] text-white/70">
            {trip.start_date
              ? `${formatDateRange(trip.start_date, trip.end_date, locale)}${durationLabel ? ` · ${durationLabel}` : ''}`
              : '날짜 미정'}
          </p>
        </div>
      </div>

      {/* 바디 카드 */}
      <div className="relative z-10 -mt-3 flex flex-1 flex-col rounded-t-3xl bg-white">
        {/* 멤버 row */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-0">
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
                    position: 'relative',
                    zIndex: trip.trip_members.length - i,
                  }}
                >
                  {name[0]}
                </div>
              )
            })}
            <button
              onClick={handleInvite}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-[#E8EAED] bg-white"
              style={{ marginLeft: -8, zIndex: 0 }}
            >
              <PlusIcon size={12} className="text-[#9099A8]" />
            </button>
          </div>
          <button onClick={handleInvite} className="text-[13px] text-[#515966]">
            {trip.trip_members.length}명 참여 중 ·{' '}
            <span className="font-medium text-[#1B6FF0]">메이트 초대</span>
          </button>
        </div>

        {/* Quick action 2버튼 */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 border-b border-[#E8EAED] px-4 pb-4">
          <Link
            href={`/${locale}/trips/${trip.id}/edit`}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-[#F5F7FA] py-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E8EAED] bg-white">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect
                  x="2"
                  y="3"
                  width="16"
                  height="14"
                  rx="2"
                  stroke="#515966"
                  strokeWidth="1.4"
                />
                <path
                  d="M6 3V1M14 3V1M2 8h16"
                  stroke="#515966"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-[11px] font-medium text-[#515966]">일정 편집</span>
          </Link>
          <button className="flex flex-col items-center gap-1.5 rounded-xl bg-[#F5F7FA] py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E8EAED] bg-white">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M13 2l4 4-10 10H3v-4L13 2z"
                  stroke="#515966"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-[11px] font-medium text-[#515966]">투표</span>
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-[#E8EAED] px-4">
          {(['일정', '장소', '메이트'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 py-3 pr-4 text-[14px] font-medium transition-colors ${
                activeTab === tab
                  ? 'border-[#1B6FF0] font-semibold text-[#1B6FF0]'
                  : 'border-transparent text-[#9099A8]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 pb-6">
          {activeTab === '일정' && (
            <ItineraryTab
              expectedDays={expectedDays}
              dayMap={dayMap}
              removedItemIds={removedItemIds}
              onRemove={handleRemoveItem}
              onTimeChange={handleTimeChange}
              tripId={trip.id}
              locale={locale}
              isOwner={isOwner}
            />
          )}
          {activeTab === '장소' && <PlacesMapTab trip={trip} locale={locale} />}
          {activeTab === '메이트' && (
            <MateTab members={trip.trip_members} profileMap={profileMap} onInvite={handleInvite} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── 일정 탭 ── */
type ExpectedDay = { dayNumber: number; dayDate: string }
type DayDB = TripDetail['itinerary_days'][number]
type ItineraryItemDB = DayDB['itinerary_items'][number]

function ItineraryTab({
  expectedDays,
  dayMap,
  removedItemIds,
  onRemove,
  onTimeChange,
  tripId,
  locale,
  isOwner,
}: {
  expectedDays: ExpectedDay[]
  dayMap: Map<string, DayDB>
  removedItemIds: Set<string>
  onRemove: (id: string) => void
  onTimeChange: (itemId: string, time: string) => void
  tripId: string
  locale: string
  isOwner: boolean
}) {
  if (expectedDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#EBF2FF]">
          <MapPinIcon size={30} className="text-[#1B6FF0]" />
        </div>
        <div>
          <p className="mb-1 text-[16px] font-semibold text-[#0F1117]">일정이 없어요</p>
          <p className="text-[13px] leading-relaxed text-[#9099A8]">
            여행 날짜를 설정하면 일정을 관리할 수 있어요
          </p>
        </div>
        {isOwner && (
          <Link
            href={`/${locale}/trips/${tripId}/edit`}
            className="mt-1 rounded-full bg-[#1B6FF0] px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            날짜 설정하기
          </Link>
        )}
      </div>
    )
  }

  return (
    <div>
      {expectedDays.map((day) => {
        const dayDB = dayMap.get(day.dayDate)
        const items = (dayDB?.itinerary_items ?? [])
          .filter((item) => !removedItemIds.has(item.id))
          .sort((a, b) => a.order_index - b.order_index)

        return (
          <div key={day.dayNumber} className="px-4 pt-4">
            {/* Day 헤더 */}
            <div className="mb-3 flex items-center gap-2.5">
              <span className="rounded-full bg-[#1B6FF0] px-3 py-0.5 text-[11px] font-bold text-white">
                Day {day.dayNumber}
              </span>
              <span className="text-[12px] text-[#9099A8]">
                {dayjs(day.dayDate).locale(locale).format('M월 D일 dddd')}
              </span>
            </div>

            {/* 아이템 리스트 */}
            <div className="mb-4 flex flex-col gap-2 border-b border-[#E8EAED] pb-4">
              {items.map((item, idx) => (
                <ItineraryItemRow
                  key={item.id}
                  item={item}
                  isLast={idx === items.length - 1}
                  locale={locale}
                  onRemove={onRemove}
                  onTimeChange={onTimeChange}
                />
              ))}

              {/* + 장소 추가 */}
              <div className="flex items-start gap-3">
                <span className="w-10 flex-shrink-0" />
                <div className="flex flex-shrink-0 flex-col items-center">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full border-2 border-dashed border-[#E8EAED] bg-white" />
                </div>
                <Link
                  href={`/${locale}/trips/${tripId}/places?day=${day.dayNumber}&date=${day.dayDate}`}
                  className="mb-1 flex flex-1 items-center rounded-[10px] border border-dashed border-[#E8EAED] bg-transparent px-3 py-2.5"
                >
                  <span className="text-[13px] text-[#9099A8]">+ 장소 추가</span>
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── 메이트 탭 ── */
function MateTab({
  members,
  profileMap,
  onInvite,
}: {
  members: { user_id: string; role: string }[]
  profileMap: Map<string, string | null>
  onInvite: () => void
}) {
  return (
    <div className="px-4 pt-4">
      <div className="flex flex-col gap-3">
        {members.map((m, i) => {
          const name = profileMap.get(m.user_id) ?? '알 수 없음'
          return (
            <div key={m.user_id} className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {name[0]}
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[#0F1117]">{name}</p>
                <p className="text-[12px] text-[#9099A8]">
                  {m.role === 'owner' ? '방장' : '메이트'}
                </p>
              </div>
            </div>
          )
        })}
        <button
          onClick={onInvite}
          className="mt-1 flex items-center gap-3 rounded-2xl border border-dashed border-[#E8EAED] px-4 py-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-[#E8EAED]">
            <PlusIcon size={16} className="text-[#9099A8]" />
          </div>
          <span className="text-[14px] text-[#9099A8]">메이트 초대하기</span>
        </button>
      </div>
    </div>
  )
}

/* ── 일정 아이템 row ── */
const SWIPE_DELETE_WIDTH = 68

function ItineraryItemRow({
  item,
  isLast,
  locale,
  onRemove,
  onTimeChange,
}: {
  item: ItineraryItemDB
  isLast: boolean
  locale: string
  onRemove: (id: string) => void
  onTimeChange: (itemId: string, time: string) => void
}) {
  const timeRef = useRef<HTMLInputElement>(null)
  const touchStartX = useRef(0)
  const [swiped, setSwiped] = useState(false)

  const catLabel = item.places?.place_categories?.name ?? '기타'
  const category = getCategoryInfoByLabel(catLabel)
  const Icon = category.icon
  const placeHref = item.places?.google_place_id
    ? `/${locale}/places/${item.places.google_place_id}`
    : null

  function openTimePicker() {
    const el = timeRef.current
    if (!el) return
    if ('showPicker' in el) {
      ;(el as HTMLInputElement & { showPicker: () => void }).showPicker()
    } else {
      ;(el as HTMLInputElement).focus()
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 40) setSwiped(true)
    else if (diff < -20) setSwiped(false)
  }

  return (
    <div className="flex items-start gap-3">
      {/* 시간 버튼 */}
      <div className="w-10 flex-shrink-0 pt-1">
        <button
          onClick={openTimePicker}
          className="w-full text-left text-[11px] leading-tight font-medium"
        >
          {item.visit_time ? (
            <span className="text-[#1B6FF0]">{item.visit_time.slice(0, 5)}</span>
          ) : (
            <span className="text-[#C0C6D0]">--:--</span>
          )}
        </button>
        <input
          ref={timeRef}
          type="time"
          className="sr-only"
          defaultValue={item.visit_time ? item.visit_time.slice(0, 5) : ''}
          onChange={(e) => onTimeChange(item.id, e.target.value)}
        />
      </div>

      {/* Dot + line */}
      <div className="flex flex-shrink-0 flex-col items-center">
        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#1B6FF0]" />
        {!isLast && <div className="mt-1 w-px flex-1 bg-[#E8EAED]" style={{ minHeight: 28 }} />}
      </div>

      {/* 스와이프 컨테이너 */}
      <div className="relative mb-1 flex-1 overflow-hidden rounded-[10px]">
        {/* 삭제 버튼 (뒤에 고정) */}
        <button
          onClick={() => onRemove(item.id)}
          className="absolute top-0 right-0 flex h-full items-center justify-center rounded-r-[10px] bg-red-500 text-[12px] font-semibold text-white active:bg-red-600"
          style={{ width: SWIPE_DELETE_WIDTH }}
          aria-label="일정에서 제거"
        >
          삭제
        </button>

        {/* 슬라이드 카드 */}
        <div
          className="flex overflow-hidden rounded-[10px] bg-[#F5F7FA]"
          style={{
            transform: swiped ? `translateX(-${SWIPE_DELETE_WIDTH}px)` : 'translateX(0)',
            transition: 'transform 0.2s ease',
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => swiped && setSwiped(false)}
        >
          <div className={`flex w-12 flex-shrink-0 items-center justify-center ${category.bg}`}>
            <Icon size={20} className={category.color} />
          </div>
          <div className="flex-1 px-3 py-2.5">
            <p className="text-[13px] font-semibold text-[#0F1117]">
              {item.places?.name ?? '알 수 없는 장소'}
            </p>
            {item.places?.address && (
              <p className="truncate text-[11px] text-[#9099A8]">{item.places.address}</p>
            )}
            {catLabel !== '기타' && (
              <span className="mt-1.5 inline-block rounded-full bg-[#EBF2FF] px-2 py-0.5 text-[10px] font-semibold text-[#1B6FF0]">
                {catLabel}
              </span>
            )}
          </div>
          {placeHref && (
            <Link
              href={placeHref}
              className="flex w-8 flex-shrink-0 items-center justify-center self-stretch text-[#9099A8]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M5.5 3.5l3.5 3.5-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

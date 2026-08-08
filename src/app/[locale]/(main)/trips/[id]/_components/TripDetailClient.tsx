'use client'

import React, { useState, useMemo, useTransition, useRef, useEffect, useLayoutEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import dayjs from '@/lib/dayjs'
import { MapPinIcon, PlusIcon } from '@/components/icons'
import BottomNav from '@/components/common/BottomNav'
import Tabs from '@/components/ui/Tabs'
import PlacesMapTab from './PlacesMapTab'
import ItemDetailSheet from './ItemDetailSheet'
import AIItinerarySheet from '@/components/features/trips/AIItinerarySheet'
import { useAssistantStore } from '@/lib/ai/store'
import { isGradient } from '@/utils/uploadCover'
import { getCategoryInfoByLabel } from '@/utils/placeCategory'
import PlacePhoto from '@/components/features/places/PlacePhoto'
import PhotoBackfillTrigger from '@/components/features/places/PhotoBackfillTrigger'
import { AVATAR_COLORS } from '@/utils/avatarColors'
import {
  formatDateRange,
  daysUntil,
  isTripOngoing,
  isTripUpcoming,
  tripDuration,
} from '@/utils/date'
import {
  removeItineraryItem,
  updateItineraryItemTime,
  reorderItineraryDay,
  kickMember,
  addMemoItem,
  updateItineraryItemMemo,
  addExpense,
  removeExpense,
} from '@/app/actions/trip'
import type { TripDetail, MemberProfile, TripExpense } from '../page'
import { usePlanStore } from '@/lib/planStore'
import { canAccess, FEATURE_PLAN } from '@/lib/planGate'
import UpgradeSheet from '@/components/features/subscription/UpgradeSheet'

type Tab = 'itinerary' | 'cost' | 'places' | 'mates'

interface Props {
  trip: TripDetail
  memberProfiles: MemberProfile[]
  currentUserId: string
  currentUserAvatar: string | null
  currentUserName: string | null
  expenses: TripExpense[]
}

export default function TripDetailClient({
  trip,
  memberProfiles,
  currentUserId,
  currentUserAvatar,
  currentUserName,
  expenses: initialExpenses,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('trips')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [removedItemIds, setRemovedItemIds] = useState<Set<string>>(new Set())
  const TAB_VALUES: Tab[] = ['itinerary', 'cost', 'places', 'mates']
  const initialTab = (TAB_VALUES.find((v) => v === searchParams.get('tab')) ?? 'itinerary') as Tab
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }
  const [activeSheetItem, setActiveSheetItem] = useState<ItineraryItemDB | null>(null)
  const [localExpenses, setLocalExpenses] = useState<TripExpense[]>(initialExpenses)
  const [memoOverrides, setMemoOverrides] = useState<Map<string, string>>(new Map())
  const [showAISheet, setShowAISheet] = useState(false)
  const [expenseUpgrade, setExpenseUpgrade] = useState(false)
  const plan = usePlanStore((s) => s.plan)

  function handleInvite() {
    router.push(`/${locale}/trips/${trip.id}/invite`)
  }

  const profileMap = new Map(
    memberProfiles.map((p) => [p.id, { name: p.name, avatar_url: p.avatar_url }]),
  )

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

  const effectiveDayMap = useMemo(() => {
    if (memoOverrides.size === 0) return dayMap
    return new Map(
      Array.from(dayMap.entries()).map(([key, day]) => [
        key,
        {
          ...day,
          itinerary_items: day.itinerary_items.map((item) =>
            memoOverrides.has(item.id) ? { ...item, memo: memoOverrides.get(item.id)! } : item,
          ),
        },
      ]),
    )
  }, [dayMap, memoOverrides])

  const expensesByDay = useMemo(() => {
    const map = new Map<string, TripExpense[]>()
    for (const e of localExpenses) {
      if (e.day_id) {
        if (!map.has(e.day_id)) map.set(e.day_id, [])
        map.get(e.day_id)!.push(e)
      }
    }
    return map
  }, [localExpenses])

  const expensesByItem = useMemo(() => {
    const map = new Map<string, TripExpense[]>()
    for (const e of localExpenses) {
      if (e.item_id) {
        if (!map.has(e.item_id)) map.set(e.item_id, [])
        map.get(e.item_id)!.push(e)
      }
    }
    return map
  }, [localExpenses])

  function handleRemoveItem(itemId: string) {
    setRemovedItemIds((prev) => new Set(prev).add(itemId))
    if (activeSheetItem?.id === itemId) setActiveSheetItem(null)
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

  function handleReorder(dayId: string, orderedIds: string[]) {
    startTransition(async () => {
      await reorderItineraryDay(dayId, orderedIds)
    })
  }

  function handleAddMemo(dayDate: string, dayNumber: number) {
    startTransition(async () => {
      await addMemoItem(trip.id, dayDate, dayNumber, '')
      router.refresh()
    })
  }

  function handleMemoSave(itemId: string, memo: string) {
    setMemoOverrides((prev) => new Map(prev).set(itemId, memo))
    startTransition(async () => {
      await updateItineraryItemMemo(itemId, memo)
      router.refresh()
    })
  }

  async function handleAddExpense(
    amount: number,
    category: string,
    note: string,
  ): Promise<string | null> {
    const item = activeSheetItem
    if (!item) return null
    if (!canAccess(plan, FEATURE_PLAN.expense)) {
      setExpenseUpgrade(true)
      return null
    }

    const dayId =
      trip.itinerary_days.find((d) => d.itinerary_items.some((i) => i.id === item.id))?.id ?? null

    const result = await addExpense({
      tripId: trip.id,
      dayId,
      itemId: item.id,
      amount,
      category,
      note,
    })

    if (result.id) {
      setLocalExpenses((prev) => [
        ...prev,
        { id: result.id!, amount, category, note: note || null, item_id: item.id, day_id: dayId },
      ])
      return result.id
    }
    return null
  }

  function handleRemoveExpense(expenseId: string) {
    setLocalExpenses((prev) => prev.filter((e) => e.id !== expenseId))
    startTransition(async () => {
      await removeExpense(expenseId)
    })
  }

  const ongoing = isTripOngoing(trip.start_date, trip.end_date)
  const upcoming = isTripUpcoming(trip.start_date)
  const numDays = tripDuration(trip.start_date, trip.end_date)
  const nights = numDays - 1

  const statusLabel = ongoing
    ? t('statusOngoing')
    : upcoming
      ? `D-${daysUntil(trip.start_date)}`
      : trip.start_date
        ? t('statusDone')
        : t('noDate')

  const durationLabel =
    numDays === 1 ? t('dayTrip') : trip.start_date ? t('nights', { nights, days: numDays }) : ''

  const isOwner = trip.owner_id === currentUserId

  /** 이미 담긴 장소명. AI가 같은 곳을 또 추천하지 않도록 넘긴다 */
  const existingPlaceNames = useMemo(
    () =>
      trip.itinerary_days
        .flatMap((d) => d.itinerary_items)
        .map((i) => i.places?.name)
        .filter((n): n is string => !!n),
    [trip.itinerary_days],
  )

  /** 아직 아무 일정도 없는 날. AI에는 이 날들만 짜게 시킨다 (일차까지 함께) */
  const emptyDays = useMemo(
    () =>
      expectedDays
        .filter((d) => (dayMap.get(d.dayDate)?.itinerary_items.length ?? 0) === 0)
        .map((d) => ({ dayNumber: d.dayNumber, dayDate: d.dayDate })),
    [expectedDays, dayMap],
  )

  const isMapTab = activeTab === 'places'
  const openAssistant = useAssistantStore((s) => s.open)

  const backfillIds = trip.itinerary_days
    .flatMap((d) => d.itinerary_items)
    .filter((item) => item.places && !item.places.photo_ref && item.places.google_place_id)
    .map((item) => item.places!.google_place_id!)
    .slice(0, 10)

  return (
    <>
    {expenseUpgrade && (
      <UpgradeSheet
        required="pro"
        feature="경비 추가"
        onClose={() => setExpenseUpgrade(false)}
      />
    )}
    <div className={`bg-bg2 flex flex-col ${isMapTab ? 'h-dvh' : 'min-h-full'}`}>
      <PhotoBackfillTrigger googlePlaceIds={backfillIds} />
      {/* 커버 */}
      <div
        className={`relative h-[220px] flex-shrink-0 ${isMapTab ? 'hidden' : ''}`}
        style={
          trip.cover_url && !isGradient(trip.cover_url)
            ? {
                backgroundImage: `url(${trip.cover_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {
                background:
                  trip.cover_url ??
                  'linear-gradient(160deg,var(--color-hero-top) 0%,var(--color-primary) 70%,var(--color-hero-bot) 100%)',
              }
        }
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.5))' }}
        />
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
              : t('noDate')}
          </p>
        </div>
      </div>

      {/* 바디 카드 */}
      <div
        className={`relative z-10 flex flex-1 flex-col bg-white ${isMapTab ? 'overflow-hidden' : '-mt-3 rounded-t-3xl'}`}
      >
        {/* 멤버 row */}
        <div className={`flex items-center gap-2.5 px-4 pt-4 pb-0 ${isMapTab ? 'hidden' : ''}`}>
          <div className="flex">
            {trip.trip_members.slice(0, 5).map((m, i) => {
              const profile = profileMap.get(m.user_id)
              const name = profile?.name ?? '?'
              const avatarUrl = profile?.avatar_url ?? null
              return avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.user_id}
                  src={avatarUrl}
                  alt={name}
                  className="h-8 w-8 flex-shrink-0 rounded-full border-2 border-white object-cover"
                  style={{
                    marginLeft: i > 0 ? -8 : 0,
                    position: 'relative',
                    zIndex: trip.trip_members.length - i,
                  }}
                />
              ) : (
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
              className="border-border relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed bg-white"
              style={{ marginLeft: -8, zIndex: 0 }}
            >
              <PlusIcon size={12} className="text-ink3" />
            </button>
          </div>
          <button onClick={handleInvite} className="text-ink2 text-[13px]">
            {t('membersJoined', { count: trip.trip_members.length })} ·{' '}
            <span className="text-primary font-medium">{t('inviteMate')}</span>
          </button>
        </div>

        {/* Quick action 2버튼 */}
        <div
          className={`border-border mt-3 grid grid-cols-2 gap-2.5 border-b px-4 pb-4 ${isMapTab ? 'hidden' : ''}`}
        >
          <Link
            href={`/${locale}/trips/${trip.id}/edit`}
            className="bg-bg2 flex flex-col items-center gap-1.5 rounded-xl py-3"
          >
            <div className="border-border flex h-10 w-10 items-center justify-center rounded-[10px] border bg-white">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect
                  x="2"
                  y="3"
                  width="16"
                  height="14"
                  rx="2"
                  stroke="var(--color-ink2)"
                  strokeWidth="1.4"
                />
                <path
                  d="M6 3V1M14 3V1M2 8h16"
                  stroke="var(--color-ink2)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-ink2 text-[11px] font-medium">{t('editItinerary')}</span>
          </Link>
          <Link
            href={`/${locale}/trips/${trip.id}/vote`}
            className="bg-bg2 flex flex-col items-center gap-1.5 rounded-xl py-3"
          >
            <div className="border-border flex h-10 w-10 items-center justify-center rounded-[10px] border bg-white">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 3.5l1.8 3.7 4 .6-2.9 2.8.7 4L10 12.4l-3.6 1.9.7-4L4.2 7.8l4-.6L10 3.5z"
                  stroke="var(--color-ink2)"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-ink2 text-[11px] font-medium">{t('vote')}</span>
          </Link>
        </div>

        {/* 탭 */}
        <Tabs
          items={[
            { key: 'itinerary' as Tab, label: t('tabItinerary') },
            { key: 'cost' as Tab, label: t('tabCost') },
            { key: 'places' as Tab, label: t('tabPlaces') },
            { key: 'mates' as Tab, label: t('tabMates') },
          ]}
          value={activeTab}
          onChange={handleTabChange}
          className="px-4"
        />

        {/* 탭 컨텐츠 */}
        <div className={isMapTab ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'flex-1 pb-20'}>
          {activeTab === 'itinerary' && (
            <ItineraryTab
              expectedDays={expectedDays}
              dayMap={effectiveDayMap}
              removedItemIds={removedItemIds}
              onRemove={handleRemoveItem}
              onTimeChange={handleTimeChange}
              onReorder={handleReorder}
              onAddMemo={handleAddMemo}
              onItemTap={setActiveSheetItem}
              tripId={trip.id}
              locale={locale}
              isOwner={isOwner}
              expensesByDay={expensesByDay}
              destination={trip.destination}
              onGenerateAI={() => setShowAISheet(true)}
            />
          )}
          {activeTab === 'cost' && (
            <ExpenseTab
              expenses={localExpenses}
              expectedDays={expectedDays}
              dayMap={dayMap}
              expensesByDay={expensesByDay}
              memberCount={trip.trip_members.length}
              locale={locale}
            />
          )}
          {activeTab === 'places' && (
            <div className="relative flex min-h-0 flex-1 flex-col">
              <PlacesMapTab
                trip={trip}
                currentUserAvatar={currentUserAvatar}
                currentUserName={currentUserName}
              />
            </div>
          )}
          {activeTab === 'mates' && (
            <MateTab
              members={trip.trip_members}
              profileMap={profileMap}
              onInvite={handleInvite}
              isOwner={isOwner}
              currentUserId={currentUserId}
              tripId={trip.id}
            />
          )}
        </div>
      </div>

      {/* 장소/메모 상세 시트 */}
      {activeSheetItem && (
        <ItemDetailSheet
          item={activeSheetItem}
          expenses={expensesByItem.get(activeSheetItem.id) ?? []}
          onClose={() => setActiveSheetItem(null)}
          onMemoSave={handleMemoSave}
          onAddExpense={handleAddExpense}
          onRemoveExpense={handleRemoveExpense}
        />
      )}

      {showAISheet && trip.start_date && trip.end_date && (
        <AIItinerarySheet
          title={trip.title}
          destination={trip.destination ?? ''}
          startDate={trip.start_date}
          endDate={trip.end_date}
          startTime={(trip.start_time ?? '').slice(0, 5)}
          endTime={(trip.end_time ?? '').slice(0, 5)}
          coverUrl={trip.cover_url ?? ''}
          tripId={trip.id}
          targetDays={emptyDays}
          excludePlaces={existingPlaceNames}
          memberCount={trip.trip_members.length}
          onClose={() => setShowAISheet(false)}
        />
      )}

      <BottomNav />
    </div>
    </>
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
  onReorder,
  onAddMemo,
  onItemTap,
  tripId,
  locale,
  isOwner,
  expensesByDay,
  destination,
  onGenerateAI,
}: {
  expectedDays: ExpectedDay[]
  dayMap: Map<string, DayDB>
  removedItemIds: Set<string>
  onRemove: (id: string) => void
  onTimeChange: (itemId: string, time: string) => void
  onReorder: (dayId: string, orderedIds: string[]) => void
  onAddMemo: (dayDate: string, dayNumber: number) => void
  onItemTap: (item: ItineraryItemDB) => void
  tripId: string
  locale: string
  isOwner: boolean
  expensesByDay: Map<string, TripExpense[]>
  destination: string | null
  onGenerateAI: () => void
}) {
  const t = useTranslations('trips')
  if (expectedDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="bg-primary-light flex h-16 w-16 items-center justify-center rounded-[20px]">
          <MapPinIcon size={30} className="text-primary" />
        </div>
        <div>
          <p className="text-ink mb-1 text-[16px] font-semibold">{t('emptyItinerary')}</p>
          <p className="text-ink3 text-[13px] leading-relaxed">{t('emptyItineraryDesc')}</p>
        </div>
        {isOwner && (
          <Link
            href={`/${locale}/trips/${tripId}/edit`}
            className="bg-primary mt-1 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            {t('setDates')}
          </Link>
        )}
      </div>
    )
  }

  const totalItems = expectedDays.reduce(
    (n, day) => n + (dayMap.get(day.dayDate)?.itinerary_items.length ?? 0),
    0,
  )
  // AI는 비어 있는 날만 채우므로, 채울 날이 남아 있을 때만 진입로를 둔다
  const emptyDayCount = expectedDays.filter(
    (day) => (dayMap.get(day.dayDate)?.itinerary_items.length ?? 0) === 0,
  ).length

  return (
    <div>
      {/* 일정이 통째로 비었을 때가 AI 생성 의도가 가장 뚜렷하다 */}
      {isOwner && totalItems === 0 && (
        <button
          onClick={onGenerateAI}
          className="mx-4 mt-3 mb-1 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl p-3.5 text-left active:opacity-90"
          style={{ background: 'linear-gradient(135deg,#0891b2 0%,#6366f1 100%)' }}
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-[18px]">
            ✨
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-white">{t('aiGenerate')}</span>
            <span className="block text-[11px] text-white/70">
              {destination ? t('aiGenerateDesc', { destination }) : t('aiGenerateDescNoDest')}
            </span>
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <path
              d="M6 3.5l4.5 4.5L6 12.5"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* 일부만 채워진 경우 — 한 번 생성했다고 진입로가 사라지면 안 되므로
          남은 빈 날을 채우는 경로를 눈에 덜 띄게 남겨둔다 */}
      {isOwner && totalItems > 0 && emptyDayCount > 0 && (
        <button
          onClick={onGenerateAI}
          className="border-border active:bg-bg2 mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-2.5 rounded-xl border border-dashed px-3.5 py-2.5 text-left"
        >
          <span className="text-[14px]">✨</span>
          <span className="min-w-0 flex-1">
            <span className="text-ink block text-[12px] font-semibold">{t('aiFillEmpty')}</span>
            <span className="text-ink3 block text-[11px]">
              {t('aiFillEmptyDesc', { count: emptyDayCount })}
            </span>
          </span>
        </button>
      )}

      {expectedDays.map((day) => {
        const dayDB = dayMap.get(day.dayDate)
        const dayExpenses = dayDB ? (expensesByDay.get(dayDB.id) ?? []) : []
        const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0)

        return (
          <div key={day.dayNumber} className="px-4 pt-4">
            {/* Day 헤더 */}
            <div className="mb-3 flex items-center gap-2.5">
              <span className="bg-primary rounded-full px-3 py-0.5 text-[11px] font-bold text-white">
                Day {day.dayNumber}
              </span>
              <span className="text-ink3 text-[12px]">
                {dayjs(day.dayDate).locale(locale).format(t('dayHeaderFormat'))}
              </span>
              {dayTotal > 0 && (
                <span className="text-ink2 ml-auto text-[11px] font-semibold">
                  {t('amountWithUnit', { amount: dayTotal.toLocaleString() })}
                </span>
              )}
            </div>

            {/* 아이템 리스트 */}
            <div className="border-border mb-4 border-b pb-4">
              {dayDB?.id && (
                <DraggableItemList
                  items={dayDB.itinerary_items}
                  removedItemIds={removedItemIds}
                  onRemove={onRemove}
                  onTimeChange={onTimeChange}
                  dayId={dayDB.id}
                  onReorder={onReorder}
                  onItemTap={onItemTap}
                />
              )}

              {/* 하단 버튼 영역 */}
              <div className="flex items-start gap-3">
                <span className="w-10 flex-shrink-0" />
                <div className="flex flex-shrink-0 flex-col items-center">
                  <div className="border-border mt-1 h-2.5 w-2.5 rounded-full border-2 border-dashed bg-white" />
                </div>
                <div className="mb-1 flex flex-1 gap-2">
                  <Link
                    href={`/${locale}/trips/${tripId}/places?day=${day.dayNumber}&date=${day.dayDate}`}
                    className="border-border flex flex-1 items-center rounded-[10px] border border-dashed bg-transparent px-3 py-2.5"
                  >
                    <span className="text-ink3 text-[13px]">{t('addPlaceInline')}</span>
                  </Link>
                  <button
                    onClick={() => onAddMemo(day.dayDate, day.dayNumber)}
                    className="border-border flex items-center rounded-[10px] border border-dashed bg-transparent px-3 py-2.5"
                  >
                    <span className="text-ink3 text-[13px]">{t('memoInline')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── 비용 탭 ── */
function ExpenseTab({
  expenses,
  expectedDays,
  dayMap,
  expensesByDay,
  memberCount,
  locale,
}: {
  expenses: TripExpense[]
  expectedDays: ExpectedDay[]
  dayMap: Map<string, DayDB>
  expensesByDay: Map<string, TripExpense[]>
  memberCount: number
  locale: string
}) {
  const t = useTranslations('trips')
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const perPerson = memberCount > 1 ? Math.ceil(totalExpenses / memberCount) : 0

  // 카테고리별 집계
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [expenses])

  if (totalExpenses === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="text-5xl">💸</span>
        <div>
          <p className="text-ink mb-1 text-[16px] font-semibold">{t('emptyExpense')}</p>
          <p className="text-ink3 text-[13px]">{t('emptyExpenseDesc')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-8">
      {/* 총경비 카드 */}
      <div className="bg-primary-light mb-4 rounded-2xl px-4 py-4">
        <p className="text-primary mb-1.5 text-[11px] font-semibold tracking-wide uppercase">
          {t('totalCost')}
        </p>
        <div className="flex items-end justify-between">
          <p className="text-primary text-[26px] leading-none font-extrabold">
            {totalExpenses.toLocaleString()}
            <span className="text-[15px] font-semibold">{t('currencyUnit')}</span>
          </p>
          {perPerson > 0 && (
            <div className="text-right">
              <p className="text-ink3 mb-0.5 text-[10px]">
                {t('splitLabel', { count: memberCount })}
              </p>
              <p className="text-ink text-[17px] font-bold">
                {t('amountWithUnit', { amount: perPerson.toLocaleString() })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 카테고리별 */}
      {categoryTotals.length > 0 && (
        <div className="border-border mb-4 overflow-hidden rounded-2xl border bg-white">
          <p className="text-ink2 border-border border-b px-4 py-2.5 text-[12px] font-semibold">
            {t('byCategory')}
          </p>
          {categoryTotals.map(([cat, amount], i) => (
            <div
              key={cat}
              className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-border border-t' : ''}`}
            >
              <span className="text-ink text-[13px] font-semibold">{cat}</span>
              <div className="bg-border mx-1 h-px flex-1" />
              <span className="text-ink2 text-[13px] font-bold">
                {t('amountWithUnit', { amount: amount.toLocaleString() })}
              </span>
              <span className="text-ink3 w-10 text-right text-[11px]">
                {Math.round((amount / totalExpenses) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 날짜별 */}
      <p className="text-ink2 mb-2 text-[12px] font-semibold">{t('byDate')}</p>
      {expectedDays.map((day) => {
        const db = dayMap.get(day.dayDate)
        const dayExpenses = db ? (expensesByDay.get(db.id) ?? []) : []
        const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0)
        return (
          <div
            key={day.dayDate}
            className="border-border mb-3 overflow-hidden rounded-2xl border bg-white"
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="bg-primary rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white">
                DAY {day.dayNumber}
              </span>
              <span className="text-ink3 text-[11px]">
                {dayjs(day.dayDate).locale(locale).format('M/D (ddd)')}
              </span>
              {dayTotal > 0 && (
                <span className="text-primary ml-auto text-[13px] font-bold">
                  {t('amountWithUnit', { amount: dayTotal.toLocaleString() })}
                </span>
              )}
            </div>
            {dayExpenses.length > 0 ? (
              <div className="border-border border-t">
                {dayExpenses.map((e, i) => (
                  <div
                    key={e.id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-border border-t' : ''}`}
                  >
                    <span className="text-ink3 text-[11px] font-semibold">{e.category}</span>
                    {e.note && (
                      <span className="text-ink3 min-w-0 flex-1 truncate text-[11px]">
                        {e.note}
                      </span>
                    )}
                    <span className="text-ink ml-auto flex-shrink-0 text-[13px] font-bold">
                      {t('amountWithUnit', { amount: e.amount.toLocaleString() })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-border border-t px-4 py-2.5">
                <p className="text-ink3 text-[12px]">{t('noExpenseShort')}</p>
              </div>
            )}
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
  isOwner,
  currentUserId,
  tripId,
}: {
  members: { user_id: string; role: string }[]
  profileMap: Map<string, { name: string | null; avatar_url: string | null }>
  onInvite: () => void
  isOwner: boolean
  currentUserId: string
  tripId: string
}) {
  const t = useTranslations('trips')
  const [, startTransition] = useTransition()
  const [kickedIds, setKickedIds] = useState<Set<string>>(new Set())

  function handleKick(userId: string, name: string | null) {
    if (!confirm(t('kickConfirm', { name: name ?? t('memberFallback') }))) return
    setKickedIds((prev) => new Set(prev).add(userId))
    startTransition(async () => {
      await kickMember(tripId, userId)
    })
  }

  const visible = members.filter((m) => !kickedIds.has(m.user_id))

  return (
    <div className="px-4 pt-4">
      <div className="flex flex-col gap-3">
        {visible.map((m, i) => {
          const profile = profileMap.get(m.user_id)
          const name = profile?.name ?? t('unknownMember')
          const avatarUrl = profile?.avatar_url ?? null
          return (
            <div key={m.user_id} className="flex items-center gap-3">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={name}
                  className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                  style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {name[0]}
                </div>
              )}
              <div className="flex-1">
                <p className="text-ink text-[14px] font-semibold">{name}</p>
                <p className="text-ink3 text-[12px]">
                  {m.role === 'owner' ? t('roleOwner') : t('roleMate')}
                </p>
              </div>
              {isOwner && m.user_id !== currentUserId && m.role !== 'owner' && (
                <button
                  onClick={() => handleKick(m.user_id, name)}
                  className="text-ink3 hover:bg-bg2 flex h-8 w-8 items-center justify-center rounded-full hover:text-red-500"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M4 4l8 8M12 4l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          )
        })}
        <button
          onClick={onInvite}
          className="border-border mt-1 flex items-center gap-3 rounded-2xl border border-dashed px-4 py-3"
        >
          <div className="border-border flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed">
            <PlusIcon size={16} className="text-ink3" />
          </div>
          <span className="text-ink3 text-[14px]">{t('inviteMateLong')}</span>
        </button>
      </div>
    </div>
  )
}

/* ── 드래그 순서변경 리스트 ── */
function DraggableItemList({
  items,
  removedItemIds,
  onRemove,
  onTimeChange,
  dayId,
  onReorder,
  onItemTap,
}: {
  items: ItineraryItemDB[]
  removedItemIds: Set<string>
  onRemove: (id: string) => void
  onTimeChange: (id: string, time: string) => void
  dayId: string
  onReorder: (dayId: string, orderedIds: string[]) => void
  onItemTap: (item: ItineraryItemDB) => void
}) {
  const itemsKey = items.map((i) => i.id + i.order_index + (i.memo ?? '')).join(',')
  const visibleItems = useMemo(
    () =>
      items.filter((i) => !removedItemIds.has(i.id)).sort((a, b) => a.order_index - b.order_index),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemsKey, removedItemIds],
  )

  const [localItems, setLocalItems] = useState<ItineraryItemDB[]>(visibleItems)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const dragFromIndex = useRef(0)
  const displayItemsRef = useRef<ItineraryItemDB[]>(localItems)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!draggingId) setLocalItems(visibleItems)
  }, [visibleItems, draggingId])

  const displayItems = useMemo(() => {
    if (draggingId === null || overIndex === null) return localItems
    const from = localItems.findIndex((i) => i.id === draggingId)
    if (from === -1 || from === overIndex) return localItems
    const reordered = [...localItems]
    const [dragged] = reordered.splice(from, 1)
    reordered.splice(overIndex, 0, dragged)
    return reordered
  }, [localItems, draggingId, overIndex])

  useLayoutEffect(() => {
    displayItemsRef.current = displayItems
  })

  useEffect(() => {
    if (!draggingId) return

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      const y = e.touches[0].clientY
      const list = listRef.current
      if (!list) return
      const children = Array.from(list.children) as HTMLElement[]
      let newOver = children.length - 1
      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect()
        if (y < rect.top + rect.height / 2) {
          newOver = i
          break
        }
      }
      setOverIndex(newOver)
    }

    function onTouchEnd() {
      const final = displayItemsRef.current
      setLocalItems(final)
      setDraggingId(null)
      setOverIndex(null)
      onReorder(
        dayId,
        final.map((i) => i.id),
      )
    }

    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [draggingId, dayId, onReorder])

  function startDrag(e: React.TouchEvent, id: string, index: number) {
    e.stopPropagation()
    dragFromIndex.current = index
    setLocalItems([...visibleItems])
    setDraggingId(id)
    setOverIndex(index)
  }

  return (
    <div ref={listRef} className="mb-2 flex flex-col gap-2">
      {displayItems.map((item, idx) => {
        const isDragging = item.id === draggingId
        return (
          <div
            key={item.id}
            style={{
              position: 'relative',
              zIndex: isDragging ? 10 : 1,
              borderRadius: 10,
              boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : undefined,
              background: isDragging ? '#fff' : undefined,
              transition: isDragging ? 'none' : 'box-shadow 0.15s',
            }}
          >
            <ItineraryItemRow
              item={item}
              isLast={idx === displayItems.length - 1}
              onRemove={onRemove}
              onTimeChange={onTimeChange}
              onTap={() => onItemTap(item)}
              isDragging={isDragging}
              onDragHandleTouchStart={(e) => startDrag(e, item.id, idx)}
            />
          </div>
        )
      })}
    </div>
  )
}

/* ── 일정 아이템 row ── */
const SWIPE_DELETE_WIDTH = 68

function ItineraryItemRow({
  item,
  isLast,
  onRemove,
  onTimeChange,
  onTap,
  isDragging = false,
  onDragHandleTouchStart,
}: {
  item: ItineraryItemDB
  isLast: boolean
  onRemove: (id: string) => void
  onTimeChange: (itemId: string, time: string) => void
  onTap: () => void
  isDragging?: boolean
  onDragHandleTouchStart?: (e: React.TouchEvent) => void
}) {
  const t = useTranslations('trips')
  const tp = useTranslations('places')
  const tc = useTranslations('common')
  const timeRef = useRef<HTMLInputElement>(null)
  const touchStartX = useRef(0)
  const [swiped, setSwiped] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isDragging) setSwiped(false)
  }, [isDragging])

  const isMemo = item.item_type === 'memo'

  const catLabel = item.places?.place_categories?.name ?? '기타'
  const category = getCategoryInfoByLabel(catLabel)
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
    if (isDragging) return
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 40) setSwiped(true)
    else if (diff < -20) setSwiped(false)
  }

  function handleCardClick() {
    if (swiped) {
      setSwiped(false)
      return
    }
    onTap()
  }

  return (
    <div className="flex items-start gap-3">
      {/* 시간 버튼 (메모 아이템은 빈 칸) */}
      <div className="w-10 flex-shrink-0 pt-1">
        {!isMemo ? (
          <>
            <button
              onClick={openTimePicker}
              className="w-full text-left text-[11px] leading-tight font-medium"
            >
              {item.visit_time ? (
                <span className="text-primary">{item.visit_time.slice(0, 5)}</span>
              ) : (
                <span className="text-ink3">--:--</span>
              )}
            </button>
            <input
              ref={timeRef}
              type="time"
              className="sr-only"
              defaultValue={item.visit_time ? item.visit_time.slice(0, 5) : ''}
              onChange={(e) => onTimeChange(item.id, e.target.value)}
            />
          </>
        ) : null}
      </div>

      {/* Dot + line */}
      <div className="flex flex-shrink-0 flex-col items-center">
        {isMemo ? (
          <div className="mt-1 h-2.5 w-2.5 rounded-full border-2 border-dashed border-amber-400 bg-amber-50" />
        ) : (
          <div className="bg-primary mt-1 h-2.5 w-2.5 rounded-full" />
        )}
        {!isLast && <div className="bg-border mt-1 w-px flex-1" style={{ minHeight: 28 }} />}
      </div>

      {/* 스와이프 컨테이너 */}
      <div className="relative mb-1 flex-1 overflow-hidden rounded-[10px]">
        {/* 삭제 버튼 */}
        <button
          onClick={() => onRemove(item.id)}
          className="absolute top-0 right-0 flex h-full items-center justify-center rounded-r-[10px] bg-red-500 text-[12px] font-semibold text-white active:bg-red-600"
          style={{ width: SWIPE_DELETE_WIDTH }}
          aria-label={t('removeFromItinerary')}
        >
          {tc('delete')}
        </button>

        {/* 슬라이드 카드 */}
        {isMemo ? (
          /* 메모 카드 */
          <div
            className="flex min-h-[52px] items-start gap-2 rounded-[10px] bg-amber-50 px-3 py-2.5"
            style={{
              transform: swiped ? `translateX(-${SWIPE_DELETE_WIDTH}px)` : 'translateX(0)',
              transition: 'transform 0.2s ease',
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={handleCardClick}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="mt-0.5 flex-shrink-0"
            >
              <path
                d="M2 12l1.5-4.5L10 1l3 3-6.5 6.5L2 12z"
                stroke="#F59E0B"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path d="M8.5 2.5l3 3" stroke="#F59E0B" strokeWidth="1.3" />
            </svg>
            <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-amber-900">
              {item.memo || <span className="text-amber-400 italic">{t('memoTapToEdit')}</span>}
            </p>
          </div>
        ) : (
          /* 장소 카드 */
          <div
            className="border-border flex overflow-hidden rounded-[10px] border"
            style={{
              transform: swiped ? `translateX(-${SWIPE_DELETE_WIDTH}px)` : 'translateX(0)',
              transition: 'transform 0.2s ease',
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={handleCardClick}
          >
            <PlacePhoto
              photoRef={item.places?.photo_ref}
              categoryStyle={category}
              iconSize={22}
              className="w-14 flex-shrink-0 self-stretch"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 bg-white px-3 py-2.5">
              <p className="text-ink text-[13px] leading-snug font-semibold break-keep">
                {item.places?.name ?? t('unknownPlace')}
              </p>
              {item.places?.address && (
                <p className="text-ink3 truncate text-[11px]">{item.places.address}</p>
              )}
              {item.memo && (
                <p className="text-ink2 truncate text-[11px] italic">&ldquo;{item.memo}&rdquo;</p>
              )}
              <p className="mt-0.5 text-[11px] font-semibold" style={{ color: category.hex }}>
                {`#${tp(category.i18nKey as never)}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 드래그 핸들 */}
      <button
        className="mb-1 flex flex-shrink-0 touch-none items-center self-stretch px-1 select-none"
        onTouchStart={onDragHandleTouchStart}
        aria-label={t('reorder')}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="4" width="10" height="1.5" rx="0.75" fill="var(--color-ink3)" />
          <rect x="2" y="8.5" width="10" height="1.5" rx="0.75" fill="var(--color-ink3)" />
        </svg>
      </button>
    </div>
  )
}

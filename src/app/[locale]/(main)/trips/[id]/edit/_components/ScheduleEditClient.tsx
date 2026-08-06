'use client'

import { useState, useMemo, useTransition, useRef, useEffect, useLayoutEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import dayjs from '@/lib/dayjs'
import {
  removeItineraryItem,
  updateItineraryItemTime,
  reorderItineraryDay,
  updateTrip,
  deleteOutOfRangeDays,
} from '@/app/actions/trip'
import { uploadCoverImage, isGradient } from '@/utils/uploadCover'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { COVER_PRESETS } from '@/utils/coverPresets'
import type { TripDetail } from '../../page'

type DayDB = TripDetail['itinerary_days'][number]
type ItemDB = DayDB['itinerary_items'][number]

type EditTab = 'info' | 'day'

export default function ScheduleEditClient({ trip }: { trip: TripDetail }) {
  const locale = useLocale()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [removedItemIds, setRemovedItemIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<EditTab | number>('info')

  // 기본 정보 상태
  const [title, setTitle] = useState(trip.title)
  const [destination, setDestination] = useState(trip.destination ?? '')
  const [startDate, setStartDate] = useState(trip.start_date ?? '')
  const [endDate, setEndDate] = useState(trip.end_date ?? '')
  const [coverUrl, setCoverUrl] = useState(trip.cover_url ?? COVER_PRESETS[0])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    affectedDays: { dayDate: string; itemCount: number }[]
  } | null>(null)

  const expectedDays = useMemo(() => {
    if (!startDate || !endDate) return []
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    const numDays = end.diff(start, 'day') + 1
    if (numDays <= 0) return []
    return Array.from({ length: numDays }, (_, i) => ({
      dayNumber: i + 1,
      dayDate: start.add(i, 'day').format('YYYY-MM-DD'),
    }))
  }, [startDate, endDate])

  const dayMap = useMemo(
    () => new Map(trip.itinerary_days.map((d) => [d.day_date, d])),
    [trip.itinerary_days],
  )

  const selectedDay = typeof activeTab === 'number' ? expectedDays[activeTab] : undefined
  const selectedDayDB = selectedDay ? dayMap.get(selectedDay.dayDate) : undefined

  const visibleItems = useMemo(() => {
    if (!selectedDayDB) return []
    return selectedDayDB.itinerary_items
      .filter((i) => !removedItemIds.has(i.id))
      .sort((a, b) => a.order_index - b.order_index)
  }, [selectedDayDB, removedItemIds])

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setUploading(false)
      return
    }
    const url = await uploadCoverImage(file, user.id)
    if (url) setCoverUrl(url)
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSaveInfo() {
    if (!title.trim()) {
      setSaveError('여행 이름을 입력해주세요')
      return
    }
    if (startDate && endDate && dayjs(endDate).isBefore(dayjs(startDate))) {
      setSaveError('종료일이 시작일보다 빠를 수 없어요')
      return
    }

    // 범위 밖으로 잘리는 날짜 확인
    if (startDate && endDate) {
      const affected = trip.itinerary_days
        .filter((d) => d.day_date < startDate || d.day_date > endDate)
        .filter((d) => d.itinerary_items.length > 0)
        .map((d) => ({ dayDate: d.day_date, itemCount: d.itinerary_items.length }))
      if (affected.length > 0) {
        setConfirmDialog({ affectedDays: affected })
        return
      }
    }

    await doSave()
  }

  async function doSave(deleteDays = false) {
    setSaving(true)
    setSaveError(null)
    setConfirmDialog(null)

    if (deleteDays && startDate && endDate) {
      await deleteOutOfRangeDays(trip.id, startDate, endDate)
    }

    const result = await updateTrip(trip.id, {
      title: title.trim(),
      destination: destination.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      cover_url: coverUrl,
    })
    setSaving(false)
    if (result.error) {
      setSaveError(result.error)
      return
    }
    router.refresh()
    router.back()
  }

  function handleRemove(itemId: string) {
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

  function handleReorder(dayId: string, orderedIds: string[]) {
    startTransition(async () => {
      await reorderItineraryDay(dayId, orderedIds)
    })
  }

  return (
    <div className="bg-bg2 relative flex h-[100dvh] flex-col">
      {/* 헤더 */}
      <div className="border-border flex h-14 flex-shrink-0 items-center justify-between border-b bg-white px-2 pr-3">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="var(--color-ink)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-ink text-[17px] font-semibold">일정 편집</span>
        {activeTab === 'info' ? (
          <Button onClick={handleSaveInfo} disabled={saving} size="sm">
            {saving ? '저장 중' : '저장'}
          </Button>
        ) : (
          <Button onClick={() => router.back()} size="sm">
            완료
          </Button>
        )}
      </div>

      {/* 탭 — DAY별 날짜 2줄 표기 + 아이콘이 있어 공통 Tabs 컴포넌트로는 표현이 안 돼 구조는 유지하고 토큰만 통일 */}
      <div className="border-border flex flex-shrink-0 [scrollbar-width:none] overflow-x-auto border-b bg-white px-3 [&::-webkit-scrollbar]:hidden">
        {/* 정보 탭 */}
        <button
          onClick={() => setActiveTab('info')}
          className={`flex flex-shrink-0 items-center gap-1 border-b-2 px-4 py-3 text-[13px] font-medium transition-colors ${
            activeTab === 'info' ? 'border-primary text-primary' : 'text-ink3 border-transparent'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
            <path
              d="M7 6v4M7 4.5v.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          정보
        </button>
        {/* 구분선 */}
        <div className="bg-border mx-1 my-3 w-px flex-shrink-0" />
        {/* Day 탭들 */}
        {expectedDays.map((day, idx) => (
          <button
            key={day.dayDate}
            onClick={() => setActiveTab(idx)}
            className={`flex flex-shrink-0 flex-col items-center gap-0.5 border-b-2 px-4 py-3 text-[13px] font-medium transition-colors ${
              activeTab === idx ? 'border-primary text-primary' : 'text-ink3 border-transparent'
            }`}
          >
            <span>DAY {day.dayNumber}</span>
            <span className="text-[10px]">{dayjs(day.dayDate).format('M/D')}</span>
          </button>
        ))}
        {expectedDays.length === 0 && (
          <span className="text-ink3 flex items-center px-2 py-3 text-[12px]">
            날짜 설정 후 일정 편집 가능
          </span>
        )}
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 [scrollbar-width:none] overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {/* ── 기본 정보 탭 ── */}
        {activeTab === 'info' && (
          <div className="flex flex-col gap-4 p-4 pb-12">
            {saveError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">
                {saveError}
              </div>
            )}

            {/* 커버 */}
            <div>
              {/* 미리보기 */}
              <div className="mb-3 h-[120px] w-full overflow-hidden rounded-2xl">
                {isGradient(coverUrl) ? (
                  <div className="h-full w-full" style={{ background: coverUrl }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="커버" className="h-full w-full object-cover" />
                )}
              </div>
              <p className="text-ink2 mb-2 text-[12px] font-semibold">커버</p>
              <div className="grid grid-cols-5 gap-2">
                {/* 이미지 업로드 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="border-ink3 bg-bg2 relative flex h-10 items-center justify-center rounded-xl border-2 border-dashed disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M9 4v10M4 9h10"
                        stroke="var(--color-ink3)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                  {!isGradient(coverUrl) && (
                    <span className="ring-primary absolute inset-0 rounded-xl ring-2 ring-offset-2" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="sr-only"
                  onChange={handleImageSelect}
                />
                {COVER_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCoverUrl(preset)}
                    className="relative h-10 rounded-xl"
                    style={{ background: preset }}
                  >
                    {coverUrl === preset && (
                      <span className="ring-primary absolute inset-0 rounded-xl ring-2 ring-offset-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 여행 이름 */}
            <div>
              <label className="text-ink2 mb-1.5 block text-[12px] font-semibold">
                여행 이름 <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="여행 이름을 입력하세요"
                className="border-border text-ink placeholder:text-ink3 focus:border-primary w-full rounded-xl border bg-white px-4 py-3 text-[14px] focus:outline-none"
              />
            </div>

            {/* 목적지 */}
            <div>
              <label className="text-ink2 mb-1.5 block text-[12px] font-semibold">목적지</label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="예) 제주도, 도쿄, 파리"
                className="border-border text-ink placeholder:text-ink3 focus:border-primary w-full rounded-xl border bg-white px-4 py-3 text-[14px] focus:outline-none"
              />
            </div>

            {/* 날짜 */}
            <div>
              <label className="text-ink2 mb-1.5 block text-[12px] font-semibold">여행 기간</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-ink3 mb-1 text-[11px]">시작일</p>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      if (endDate && e.target.value > endDate) setEndDate(e.target.value)
                    }}
                    className="border-border text-ink focus:border-primary w-full rounded-xl border bg-white px-3 py-3 text-[14px] focus:outline-none"
                  />
                </div>
                <div className="text-ink3 flex items-end pb-[13px]">—</div>
                <div className="flex-1">
                  <p className="text-ink3 mb-1 text-[11px]">종료일</p>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-border text-ink focus:border-primary w-full rounded-xl border bg-white px-3 py-3 text-[14px] focus:outline-none"
                  />
                </div>
              </div>
              {startDate && endDate && expectedDays.length > 0 && (
                <p className="text-primary mt-1.5 text-[12px]">
                  {expectedDays.length === 1
                    ? '당일치기'
                    : `${expectedDays.length - 1}박 ${expectedDays.length}일`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Day 탭 컨텐츠 ── */}
        {typeof activeTab === 'number' && selectedDay && (
          <div className="p-3 pb-24">
            {/* Day 요약 */}
            <div className="border-border mb-3 flex gap-5 rounded-2xl border bg-white px-4 py-3.5">
              <div className="flex flex-col items-center gap-1">
                <span className="text-ink text-[18px] font-bold">{visibleItems.length}</span>
                <span className="text-ink3 text-[11px]">장소</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-ink text-[18px] font-bold">
                  {dayjs(selectedDay.dayDate).format('M/D')}
                </span>
                <span className="text-ink3 text-[11px]">날짜</span>
              </div>
            </div>

            {selectedDayDB?.id && (
              <DraggableTimelineList
                items={visibleItems}
                locale={locale}
                onRemove={handleRemove}
                onTimeChange={handleTimeChange}
                dayId={selectedDayDB.id}
                onReorder={handleReorder}
              />
            )}

            <div className="pl-[64px]">
              <Link
                href={`/${locale}/trips/${trip.id}/places?day=${selectedDay.dayNumber}&date=${selectedDay.dayDate}`}
                className="border-border text-ink3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed py-3 text-[13px]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 3v10M3 8h10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                장소 추가
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 범위 밖 날짜 삭제 확인 다이얼로그 */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <p className="text-ink mb-1 text-[16px] font-bold">장소가 삭제돼요</p>
            <p className="text-ink2 mb-3 text-[13px]">
              변경된 날짜 범위 밖의 날에 등록된 장소가 있어요.
            </p>
            <div className="bg-bg2 mb-4 flex flex-col gap-1 rounded-xl px-4 py-3">
              {confirmDialog.affectedDays.map((d) => (
                <div key={d.dayDate} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink2">{dayjs(d.dayDate).format('M월 D일 (ddd)')}</span>
                  <span className="font-semibold text-red-500">장소 {d.itemCount}개 삭제</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="border-border text-ink2 flex-1 rounded-xl border py-3 text-[14px] font-medium"
              >
                취소
              </button>
              <button
                onClick={() => doSave(true)}
                disabled={saving}
                className="flex-1 rounded-xl bg-red-500 py-3 text-[14px] font-semibold text-white disabled:opacity-60"
              >
                {saving ? '저장 중...' : '삭제 후 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB — 일정 탭에서만 */}
      {typeof activeTab === 'number' && selectedDay && (
        <Link
          href={`/${locale}/trips/${trip.id}/places?day=${selectedDay.dayNumber}&date=${selectedDay.dayDate}`}
          className="bg-primary fixed right-4 bottom-6 flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-[0_4px_16px_rgba(27,111,240,0.4)]"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 4v14M4 11h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      )}
    </div>
  )
}

/* ── 드래그 타임라인 리스트 ── */
function DraggableTimelineList({
  items,
  locale,
  onRemove,
  onTimeChange,
  dayId,
  onReorder,
}: {
  items: ItemDB[]
  locale: string
  onRemove: (id: string) => void
  onTimeChange: (id: string, time: string) => void
  dayId: string
  onReorder: (dayId: string, orderedIds: string[]) => void
}) {
  const [localItems, setLocalItems] = useState<ItemDB[]>(items)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const displayItemsRef = useRef<ItemDB[]>(localItems)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!draggingId) setLocalItems(items)
  }, [items, draggingId])

  const displayItems = useMemo(() => {
    if (draggingId === null || overIndex === null) return localItems
    const from = localItems.findIndex((i) => i.id === draggingId)
    if (from === -1 || from === overIndex) return localItems
    const arr = [...localItems]
    const [dragged] = arr.splice(from, 1)
    arr.splice(overIndex, 0, dragged)
    return arr
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

  function startDrag(e: React.TouchEvent, id: string, idx: number) {
    e.stopPropagation()
    setLocalItems([...items])
    setDraggingId(id)
    setOverIndex(idx)
  }

  return (
    <div ref={listRef} className="mb-2 flex flex-col">
      {displayItems.map((item, idx) => {
        const isDragging = item.id === draggingId
        return (
          <div
            key={item.id}
            style={{
              position: 'relative',
              zIndex: isDragging ? 10 : 1,
              boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : undefined,
              borderRadius: isDragging ? 12 : undefined,
              background: isDragging ? '#fff' : undefined,
              transition: isDragging ? 'none' : 'box-shadow 0.15s',
            }}
          >
            <TimelineItemRow
              item={item}
              isLast={idx === displayItems.length - 1}
              locale={locale}
              onRemove={onRemove}
              onTimeChange={onTimeChange}
              isDragging={isDragging}
              onDragHandleTouchStart={(e) => startDrag(e, item.id, idx)}
            />
          </div>
        )
      })}
    </div>
  )
}

/* ── 타임라인 아이템 row ── */
const SWIPE_DELETE_WIDTH = 68

function TimelineItemRow({
  item,
  isLast,
  locale,
  onRemove,
  onTimeChange,
  isDragging = false,
  onDragHandleTouchStart,
}: {
  item: ItemDB
  isLast: boolean
  locale: string
  onRemove: (id: string) => void
  onTimeChange: (itemId: string, time: string) => void
  isDragging?: boolean
  onDragHandleTouchStart?: (e: React.TouchEvent) => void
}) {
  const timeRef = useRef<HTMLInputElement>(null)
  const touchStartX = useRef(0)
  const [swiped, setSwiped] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isDragging) setSwiped(false)
  }, [isDragging])

  const catLabel = item.places?.place_categories?.name ?? '기타'
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
    if (isDragging) return
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 40) setSwiped(true)
    else if (diff < -20) setSwiped(false)
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-11 flex-shrink-0 pt-[14px] text-right">
        <button
          onClick={openTimePicker}
          className="w-full text-right text-[11px] leading-tight font-medium"
        >
          {item.visit_time ? (
            <span className="text-ink3">{item.visit_time.slice(0, 5)}</span>
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
      </div>

      <div className="mt-[6px] flex w-5 flex-shrink-0 flex-col items-center">
        <div className="bg-primary h-2.5 w-2.5 flex-shrink-0 rounded-full" />
        {!isLast && <div className="bg-border mt-1 w-0.5 flex-1" style={{ minHeight: 32 }} />}
      </div>

      <div className="mb-2 flex flex-1 items-start gap-1">
        <div className="relative flex-1 overflow-hidden rounded-xl">
          <button
            onClick={() => onRemove(item.id)}
            className="absolute top-0 right-0 flex h-full items-center justify-center rounded-r-xl bg-red-500 text-[12px] font-semibold text-white active:bg-red-600"
            style={{ width: SWIPE_DELETE_WIDTH }}
            aria-label="삭제"
          >
            삭제
          </button>

          <div
            className="border-border border bg-white"
            style={{
              transform: swiped ? `translateX(-${SWIPE_DELETE_WIDTH}px)` : 'translateX(0)',
              transition: 'transform 0.2s ease',
              borderRadius: 12,
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={() => swiped && setSwiped(false)}
          >
            <div className="px-3.5 py-3">
              <p className="text-ink text-[14px] font-semibold">
                {item.places?.name ?? '알 수 없는 장소'}
              </p>
              {item.places?.address && (
                <p className="text-ink3 mt-0.5 truncate text-[12px]">{item.places.address}</p>
              )}
              {item.memo && (
                <p className="border-border text-ink2 mt-1.5 border-t pt-1.5 text-[12px]">
                  {item.memo}
                </p>
              )}
              <div className="mt-2 flex items-center gap-1.5">
                {catLabel !== '기타' && (
                  <span className="bg-primary-light text-primary rounded-full px-2 py-0.5 text-[11px] font-medium">
                    {catLabel}
                  </span>
                )}
                {placeHref && (
                  <Link
                    href={placeHref}
                    onClick={(e) => e.stopPropagation()}
                    className="border-border text-ink3 rounded-full border px-2 py-0.5 text-[11px]"
                  >
                    상세 보기
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          className="flex flex-shrink-0 touch-none items-center self-stretch px-1 pb-2 select-none"
          onTouchStart={onDragHandleTouchStart}
          aria-label="순서 변경"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="4" width="10" height="1.5" rx="0.75" fill="var(--color-ink3)" />
            <rect x="2" y="8.5" width="10" height="1.5" rx="0.75" fill="var(--color-ink3)" />
          </svg>
        </button>
      </div>
    </div>
  )
}

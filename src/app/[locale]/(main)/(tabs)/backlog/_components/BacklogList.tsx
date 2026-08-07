'use client'

import React, { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getCategoryInfoByLabel } from '@/utils/placeCategory'
import { removeFromBacklog } from '@/app/actions/backlog'
import { SearchIcon, MapPinIcon, BacklogIcon } from '@/components/icons'
import Tabs, { type TabItem } from '@/components/ui/Tabs'

type BacklogItem = {
  id: string
  memo: string | null
  places: {
    google_place_id: string | null
    name: string
    address: string | null
    place_categories: { name: string } | null
  } | null
}

export default function BacklogList({ items: initialItems }: { items: BacklogItem[] }) {
  const locale = useLocale()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('전체')
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const items = useMemo(
    () => initialItems.filter((item) => !removedIds.has(item.id)),
    [initialItems, removedIds],
  )

  const categoryTabs = useMemo(() => {
    const cats = new Set(items.map((item) => item.places?.place_categories?.name ?? '기타'))
    return ['전체', ...Array.from(cats)]
  }, [items])

  function handleRemove(itemId: string) {
    setRemovedIds((prev) => {
      const next = new Set(prev).add(itemId)
      // 삭제 후 activeTab 카테고리 아이템이 전부 사라지면 '전체'로 리셋
      const remaining = initialItems.filter((item) => !next.has(item.id))
      const stillExists = remaining.some(
        (item) => (item.places?.place_categories?.name ?? '기타') === activeTab,
      )
      if (!stillExists && activeTab !== '전체') setActiveTab('전체')
      return next
    })
    startTransition(async () => {
      await removeFromBacklog(itemId)
      router.refresh()
    })
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const name = item.places?.name ?? ''
      const catName = item.places?.place_categories?.name ?? '기타'

      const matchesTab = activeTab === '전체' || catName === activeTab
      const matchesQuery = query.trim() === '' || name.includes(query.trim())
      return matchesTab && matchesQuery
    })
  }, [items, query, activeTab])

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
        <div className="bg-primary-light flex h-20 w-20 items-center justify-center rounded-[24px]">
          <MapPinIcon size={36} className="text-primary" />
        </div>
        <div>
          <p className="text-ink mb-1 text-[16px] font-semibold">저장한 장소가 없어요</p>
          <p className="text-ink3 text-[13px] leading-relaxed">
            여행지를 탐색하고 가고 싶은 장소를 저장해보세요
          </p>
        </div>
        <Link
          href={`/${locale}/places`}
          className="bg-primary mt-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
        >
          장소 탐색하기
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* 헤더 영역 */}
      <div className="bg-bg border-border border-b px-4 pt-3 pb-0">
        {/* 검색바 */}
        <div className="border-border bg-bg2 mb-3 flex items-center gap-2 rounded-xl border px-3 py-2.5">
          <SearchIcon className="text-ink3 flex-shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="장소 이름으로 검색"
            className="text-ink placeholder:text-ink3 flex-1 bg-transparent text-[14px] outline-none"
            autoComplete="off"
          />
        </div>

        {/* 카테고리 탭 */}
        <Tabs
          variant="pill"
          items={categoryTabs.map<TabItem<string>>((tab) => ({ key: tab, label: tab }))}
          value={activeTab}
          onChange={setActiveTab}
          className="pb-3"
        />
      </div>

      {/* 리스트 */}
      <div className="flex flex-col gap-2.5 px-4 py-4">
        {filtered.length === 0 ? (
          <p className="text-ink3 py-12 text-center text-[14px]">검색 결과가 없어요</p>
        ) : (
          filtered.map((item) => {
            const catLabel = item.places?.place_categories?.name ?? '기타'
            const category = getCategoryInfoByLabel(catLabel)
            const Icon = category.icon
            const href = item.places?.google_place_id
              ? `/${locale}/places/${item.places.google_place_id}`
              : null

            const removeButton = (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleRemove(item.id)
                }}
                className="flex w-12 flex-shrink-0 items-center justify-center self-stretch active:opacity-50"
                aria-label="백로그에서 제거"
              >
                <BacklogIcon size={20} filled className="text-primary" />
              </button>
            )

            const inner = (
              <>
                {/* 썸네일 */}
                <div
                  className={`flex w-20 flex-shrink-0 items-center justify-center ${category.bg}`}
                >
                  <Icon size={28} className={category.color} />
                </div>
                {/* 바디 */}
                <div className="flex min-w-0 flex-1 flex-col justify-between px-3.5 py-3">
                  <div>
                    <p className="text-ink truncate text-[14px] leading-tight font-bold">
                      {item.places?.name ?? '알 수 없는 장소'}
                    </p>
                    {item.places?.address && (
                      <p className="text-ink3 mt-0.5 truncate text-[11px]">{item.places.address}</p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[11px] font-semibold ${category.color}`}>
                      {category.hashLabel}
                    </span>
                    {item.memo && (
                      <p className="text-ink2 ml-2 max-w-[120px] truncate text-[11px] italic">
                        &ldquo;{item.memo}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
                {removeButton}
              </>
            )

            return (
              <div key={item.id}>
                {href ? (
                  <Link
                    href={href}
                    className="border-border bg-bg flex min-h-[80px] overflow-hidden rounded-2xl border active:opacity-80"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="border-border bg-bg flex min-h-[80px] overflow-hidden rounded-2xl border">
                    {inner}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

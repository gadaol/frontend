'use client'

import React, { useState, useMemo, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { getCategoryInfoByLabel, getCategoryStyle } from '@/utils/placeCategory'
import { removeFromBacklog } from '@/app/actions/backlog'
import {
  createCollection,
  deleteCollection,
  renameCollection,
  moveItemToCollection,
} from '@/app/actions/collection'
import type { BacklogCollection } from '@/app/actions/collection'
import { SearchIcon, MapPinIcon, BacklogIcon } from '@/components/icons'
import Tabs, { type TabItem } from '@/components/ui/Tabs'
import PlacePhoto from '@/components/features/places/PlacePhoto'
import PhotoBackfillTrigger from '@/components/features/places/PhotoBackfillTrigger'
import { usePlanStore } from '@/lib/planStore'
import { canAccess, FEATURE_PLAN } from '@/lib/planGate'
import UpgradeSheet from '@/components/features/subscription/UpgradeSheet'

type BacklogItem = {
  id: string
  memo: string | null
  collection_id: string | null
  places: {
    google_place_id: string | null
    name: string
    address: string | null
    photo_ref: string | null
    place_categories: { name: string } | null
  } | null
}

/** 카테고리 필터의 '전체' 상태값 — 화면 문구가 아니라 내부 키다 */
const ALL = '__all__'

interface Props {
  items: BacklogItem[]
  collections: BacklogCollection[]
}

export default function BacklogList({
  items: initialItems,
  collections: initialCollections,
}: Props) {
  const t = useTranslations('backlog')
  const tc = useTranslations('common')
  const tp = useTranslations('places')
  const locale = useLocale()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null) // null = 전체
  const [activeCategory, setActiveCategory] = useState(ALL)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [collections, setCollections] = useState<BacklogCollection[]>(initialCollections)
  const [, startTransition] = useTransition()

  const plan = usePlanStore((s) => s.plan)
  const [collectionUpgrade, setCollectionUpgrade] = useState(false)

  // 컬렉션 생성 시트
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [creating, setCreating] = useState(false)

  // 이동 시트
  const [movingItemId, setMovingItemId] = useState<string | null>(null)

  // 컬렉션 편집 (이름 변경 / 삭제)
  const [editingCollection, setEditingCollection] = useState<BacklogCollection | null>(null)
  const [editName, setEditName] = useState('')

  const nameInputRef = useRef<HTMLInputElement>(null)

  const backfillIds = useMemo(
    () =>
      initialItems
        .filter((item) => item.places && !item.places.photo_ref && item.places.google_place_id)
        .map((item) => item.places!.google_place_id!)
        .slice(0, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const items = useMemo(
    () => initialItems.filter((item) => !removedIds.has(item.id)),
    [initialItems, removedIds],
  )

  // 현재 컬렉션 탭에 맞게 필터된 아이템
  const collectionFiltered = useMemo(() => {
    if (activeCollectionId === null) return items
    if (activeCollectionId === '__none__') return items.filter((i) => !i.collection_id)
    return items.filter((i) => i.collection_id === activeCollectionId)
  }, [items, activeCollectionId])

  const categoryTabs = useMemo(() => {
    const cats = new Set(
      collectionFiltered.map((item) => item.places?.place_categories?.name ?? '기타'),
    )
    return [ALL, ...Array.from(cats)]
  }, [collectionFiltered])

  const filtered = useMemo(() => {
    return collectionFiltered.filter((item) => {
      const name = item.places?.name ?? ''
      const catName = item.places?.place_categories?.name ?? '기타'
      const matchesTab = activeCategory === ALL || catName === activeCategory
      const matchesQuery = query.trim() === '' || name.includes(query.trim())
      return matchesTab && matchesQuery
    })
  }, [collectionFiltered, query, activeCategory])

  function handleRemove(itemId: string) {
    setRemovedIds((prev) => new Set(prev).add(itemId))
    startTransition(async () => {
      await removeFromBacklog(itemId)
      router.refresh()
    })
  }

  async function handleCreateCollection() {
    if (!newCollectionName.trim() || creating) return
    setCreating(true)
    const result = await createCollection(newCollectionName)
    if ('id' in result) {
      const nextOrder = collections.length
      setCollections((prev) => [
        ...prev,
        { id: result.id, name: newCollectionName.trim(), order_index: nextOrder },
      ])
      setActiveCollectionId(result.id)
    }
    setNewCollectionName('')
    setShowCreateSheet(false)
    setCreating(false)
    router.refresh()
  }

  async function handleMoveItem(itemId: string, collectionId: string | null) {
    setMovingItemId(null)
    startTransition(async () => {
      await moveItemToCollection(itemId, collectionId)
      router.refresh()
    })
  }

  async function handleRename() {
    if (!editingCollection || !editName.trim()) return
    const col = editingCollection
    setCollections((prev) =>
      prev.map((c) => (c.id === col.id ? { ...c, name: editName.trim() } : c)),
    )
    setEditingCollection(null)
    await renameCollection(col.id, editName.trim())
    router.refresh()
  }

  async function handleDeleteCollection(col: BacklogCollection) {
    setCollections((prev) => prev.filter((c) => c.id !== col.id))
    if (activeCollectionId === col.id) setActiveCollectionId(null)
    setEditingCollection(null)
    await deleteCollection(col.id)
    router.refresh()
  }

  // 컬렉션 탭 데이터 (전체 + 각 컬렉션 + 미분류)
  const collectionTabItems = useMemo(() => {
    const tabs: Array<{ key: string | null; label: string; count: number }> = [
      { key: null, label: t('all'), count: items.length },
      ...collections.map((c) => ({
        key: c.id,
        label: c.name,
        count: items.filter((i) => i.collection_id === c.id).length,
      })),
    ]
    const noneCount = items.filter((i) => !i.collection_id).length
    if (noneCount > 0 && collections.length > 0) {
      tabs.push({ key: '__none__', label: t('uncategorized'), count: noneCount })
    }
    return tabs
  }, [items, collections, t])

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
        <div className="bg-primary-light flex h-20 w-20 items-center justify-center rounded-[24px]">
          <MapPinIcon size={36} className="text-primary" />
        </div>
        <div>
          <p className="text-ink mb-1 text-[16px] font-semibold">{t('empty')}</p>
          <p className="text-ink3 text-[13px] leading-relaxed">{t('emptyDesc')}</p>
        </div>
        <Link
          href={`/${locale}/places`}
          className="bg-primary mt-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
        >
          {t('explore')}
        </Link>
      </div>
    )
  }

  return (
    <>
    {collectionUpgrade && (
      <UpgradeSheet
        required="pro"
        feature="컬렉션"
        onClose={() => setCollectionUpgrade(false)}
      />
    )}
    <div className="flex flex-1 flex-col">
      <PhotoBackfillTrigger googlePlaceIds={backfillIds} />

      {/* 컬렉션 탭 */}
      <div className="bg-bg border-border border-b">
        <div className="flex items-center">
          <div className="min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-0 px-4 pt-3 pb-0">
              {collectionTabItems.map((tab) => {
                const isActive = activeCollectionId === tab.key
                return (
                  // 편집 버튼을 탭 버튼 안에 넣으면 button 중첩이라 하이드레이션이 깨진다.
                  // 밑줄은 감싸는 div가 그리고, 두 버튼은 형제로 둔다.
                  <div
                    key={String(tab.key)}
                    className={`flex flex-shrink-0 items-center border-b-2 transition-colors ${
                      isActive ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveCollectionId(tab.key)
                        setActiveCategory(ALL)
                      }}
                      className={`flex items-center gap-1.5 py-2.5 pl-3.5 text-[13px] font-semibold transition-colors ${
                        isActive ? 'text-primary' : 'text-ink3'
                      } ${tab.key !== null && tab.key !== '__none__' ? 'pr-1' : 'pr-3.5'}`}
                    >
                      {tab.label}
                      <span
                        className={`text-[11px] font-medium ${isActive ? 'text-primary/70' : 'text-ink3/60'}`}
                      >
                        {tab.count}
                      </span>
                    </button>
                    {tab.key !== null && tab.key !== '__none__' && (
                      <button
                        onClick={() => {
                          const col = collections.find((c) => c.id === tab.key)
                          if (col) {
                            setEditingCollection(col)
                            setEditName(col.name)
                          }
                        }}
                        aria-label={t('editCollection')}
                        className="text-ink3/50 hover:text-ink3 py-2.5 pr-3 pl-0.5"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
                          <path
                            d="M5 3v2.5M5 7v.1"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {/* 컬렉션 추가 버튼 */}
          <button
            onClick={() => {
              if (!canAccess(plan, FEATURE_PLAN.collection)) { setCollectionUpgrade(true); return }
              setShowCreateSheet(true)
              setTimeout(() => nameInputRef.current?.focus(), 50)
            }}
            className="border-border text-ink3 mx-3 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 2v8M2 6h8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 헤더: 검색 + 카테고리 */}
      <div className="bg-bg border-border border-b px-4 pt-3 pb-0">
        <div className="border-border bg-bg2 mb-3 flex items-center gap-2 rounded-xl border px-3 py-2.5">
          <SearchIcon className="text-ink3 flex-shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="text-ink placeholder:text-ink3 flex-1 bg-transparent text-[14px] outline-none"
            autoComplete="off"
          />
        </div>
        <Tabs
          variant="pill"
          items={categoryTabs.map<TabItem<string>>((tab) => ({
            key: tab,
            // 탭 값은 DB 카테고리명이라 그대로 두고 라벨만 번역한다
            label: tab === ALL ? t('all') : tp(getCategoryStyle(tab).i18nKey as never),
          }))}
          value={activeCategory}
          onChange={setActiveCategory}
          className="pb-3"
        />
      </div>

      {/* 리스트 */}
      <div className="flex flex-col gap-2.5 px-4 py-4">
        {filtered.length === 0 ? (
          <p className="text-ink3 py-12 text-center text-[14px]">
            {activeCollectionId !== null && collectionFiltered.length === 0
              ? t('emptyInCollection')
              : t('noResults')}
          </p>
        ) : (
          filtered.map((item) => {
            const catLabel = item.places?.place_categories?.name ?? '기타'
            const category = getCategoryInfoByLabel(catLabel)
            const href = item.places?.google_place_id
              ? `/${locale}/places/${item.places.google_place_id}`
              : null
            const currentCollection = collections.find((c) => c.id === item.collection_id)

            const inner = (
              <>
                <PlacePhoto
                  photoRef={item.places?.photo_ref}
                  categoryStyle={category}
                  iconSize={28}
                  className="w-20 flex-shrink-0 self-stretch rounded-l-2xl"
                />
                <div className="flex min-w-0 flex-1 flex-col justify-between px-3.5 py-3">
                  <div>
                    <p className="text-ink truncate text-[14px] leading-tight font-bold">
                      {item.places?.name ?? t('unknownPlace')}
                    </p>
                    {item.places?.address && (
                      <p className="text-ink3 mt-0.5 truncate text-[11px]">{item.places.address}</p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[11px] font-semibold ${category.color}`}>
                      {`#${tp(category.i18nKey as never)}`}
                    </span>
                    {currentCollection && (
                      <span className="bg-primary/10 text-primary ml-2 max-w-[100px] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        {currentCollection.name}
                      </span>
                    )}
                  </div>
                </div>
                {/* 우측 액션 */}
                <div className="flex flex-shrink-0 flex-col items-center justify-center gap-1 pr-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setMovingItemId(item.id)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full active:opacity-50"
                    aria-label={t('moveCollection')}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 4h12M2 8h8M2 12h5"
                        stroke="var(--color-ink3)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 10l2 2-2 2"
                        stroke="var(--color-primary)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleRemove(item.id)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full active:opacity-50"
                    aria-label={t('removeFromBacklog')}
                  >
                    <BacklogIcon size={18} filled className="text-primary" />
                  </button>
                </div>
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

      {/* 컬렉션 이동 시트 */}
      {movingItemId && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/40" onClick={() => setMovingItemId(null)} />
          <div className="fixed inset-x-0 bottom-0 z-[81] rounded-t-3xl bg-white pb-8">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-gray-200" />
            </div>
            <p className="text-ink px-5 pt-1 pb-3 text-[16px] font-bold">{t('moveCollection')}</p>
            <div className="divide-border divide-y overflow-y-auto" style={{ maxHeight: '60dvh' }}>
              {/* 미분류 */}
              <button
                onClick={() => handleMoveItem(movingItemId, null)}
                className="flex w-full items-center gap-3 px-5 py-3.5 active:bg-gray-50"
              >
                <div className="bg-bg2 flex h-9 w-9 items-center justify-center rounded-full">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="2"
                      y="2"
                      width="12"
                      height="12"
                      rx="2"
                      stroke="var(--color-ink3)"
                      strokeWidth="1.4"
                    />
                  </svg>
                </div>
                <span className="text-ink2 text-[14px]">{t('uncategorized')}</span>
                {items.find((i) => i.id === movingItemId)?.collection_id === null && (
                  <svg className="ml-auto" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8l4 4 6-7"
                      stroke="var(--color-primary)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleMoveItem(movingItemId, col.id)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 active:bg-gray-50"
                >
                  <div className="bg-primary-light flex h-9 w-9 items-center justify-center rounded-full">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 5.5C2 4.67 2.67 4 3.5 4h3l1.5 2H12.5c.83 0 1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5h-9C2.67 13 2 12.33 2 11.5v-6z"
                        stroke="var(--color-primary)"
                        strokeWidth="1.4"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <span className="text-ink text-[14px] font-medium">{col.name}</span>
                  {items.find((i) => i.id === movingItemId)?.collection_id === col.id && (
                    <svg className="ml-auto" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8l4 4 6-7"
                        stroke="var(--color-primary)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="px-5 pt-3">
              <button
                onClick={() => {
                  setMovingItemId(null)
                  if (!canAccess(plan, FEATURE_PLAN.collection)) { setCollectionUpgrade(true); return }
                  setShowCreateSheet(true)
                  setTimeout(() => nameInputRef.current?.focus(), 50)
                }}
                className="border-border text-primary flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-[14px] font-semibold"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 2v10M2 7h10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                {t('createCollection')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 컬렉션 생성 시트 */}
      {showCreateSheet && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/40"
            onClick={() => setShowCreateSheet(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[81] rounded-t-3xl bg-white px-5 pt-5 pb-8">
            <p className="text-ink mb-4 text-[17px] font-bold">{t('newCollection')}</p>
            <input
              ref={nameInputRef}
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && !e.nativeEvent.isComposing && handleCreateCollection()
              }
              placeholder={t('collectionNamePlaceholder')}
              className="border-border bg-bg2 focus:border-primary mb-4 w-full rounded-xl border px-4 py-3 text-[15px] outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateSheet(false)}
                className="border-border text-ink h-[52px] flex-1 rounded-xl border text-[15px] font-medium"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim() || creating}
                className="bg-primary h-[52px] flex-1 rounded-xl text-[15px] font-bold text-white disabled:opacity-40"
              >
                {creating ? t('creating') : t('create')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 컬렉션 편집 시트 */}
      {editingCollection && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/40"
            onClick={() => setEditingCollection(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[81] rounded-t-3xl bg-white px-5 pt-5 pb-8">
            <p className="text-ink mb-4 text-[17px] font-bold">{t('editCollection')}</p>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleRename()}
              className="border-border bg-bg2 focus:border-primary mb-4 w-full rounded-xl border px-4 py-3 text-[15px] outline-none"
            />
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleRename}
                disabled={!editName.trim()}
                className="bg-primary h-[52px] w-full rounded-xl text-[15px] font-bold text-white disabled:opacity-40"
              >
                {t('renameCollection')}
              </button>
              <button
                onClick={() => handleDeleteCollection(editingCollection)}
                className="bg-error-light text-error h-[52px] w-full rounded-xl text-[15px] font-semibold"
              >
                {t('deleteCollection')}
              </button>
              <button
                onClick={() => setEditingCollection(null)}
                className="border-border text-ink3 h-[52px] w-full rounded-xl border text-[15px]"
              >
                {tc('cancel')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  )
}

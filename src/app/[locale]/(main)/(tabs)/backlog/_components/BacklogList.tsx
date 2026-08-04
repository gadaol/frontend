'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { getCategoryInfoByLabel } from '@/utils/placeCategory'
import { SearchIcon, MapPinIcon } from '@/components/icons'

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

const CATEGORY_TABS = ['전체', '식당', '카페', '숙소', '관광지', '쇼핑', '자연', '액티비티', '기타']

export default function BacklogList({ items }: { items: BacklogItem[] }) {
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('전체')

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
        <div className="border-border mb-3 flex items-center gap-2 rounded-xl border bg-[#F5F7FA] px-3 py-2.5">
          <SearchIcon className="flex-shrink-0 text-[#9099A8]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="장소 이름으로 검색"
            className="flex-1 bg-transparent text-[14px] text-[#0F1117] outline-none placeholder:text-[#9099A8]"
            autoComplete="off"
          />
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'border-border bg-bg border text-[#515966]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
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

            const card = (
              <div className="border-border bg-bg flex min-h-[80px] overflow-hidden rounded-2xl border active:opacity-80">
                {/* 썸네일 */}
                <div
                  className={`flex w-20 flex-shrink-0 items-center justify-center ${category.bg}`}
                >
                  <Icon size={28} className={category.color} />
                </div>
                {/* 바디 */}
                <div className="flex min-w-0 flex-1 flex-col justify-between px-3.5 py-3">
                  <div>
                    <span
                      className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${category.bg} ${category.color}`}
                    >
                      {catLabel}
                    </span>
                    <p className="text-ink truncate text-[14px] leading-tight font-bold">
                      {item.places?.name ?? '알 수 없는 장소'}
                    </p>
                    {item.places?.address && (
                      <p className="text-ink3 mt-0.5 truncate text-[11px]">{item.places.address}</p>
                    )}
                  </div>
                  {item.memo && (
                    <p className="text-ink2 mt-2 truncate text-[11px] italic">
                      &ldquo;{item.memo}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            )

            return href ? (
              <Link key={item.id} href={href}>
                {card}
              </Link>
            ) : (
              <div key={item.id}>{card}</div>
            )
          })
        )}
      </div>
    </div>
  )
}

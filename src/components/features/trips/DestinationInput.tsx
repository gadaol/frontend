'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { MapPinIcon } from '@/components/icons'
import {
  DESTINATIONS,
  destinationName,
  destinationRegion,
  destinationPhotoUrl,
} from '@/lib/destinations'
import type { Locale } from '@/lib/ai/characters'

interface Prediction {
  placeId: string
  mainText: string
  secondaryText: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  name?: string
}

export default function DestinationInput({ value, onChange, name }: Props) {
  const locale = useLocale() as Locale
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [searching, setSearching] = useState(false)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
    else {
      // 시트를 닫으면 다음에 열었을 때 이전 검색어가 남지 않도록 즉시 비운다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('')
      setPredictions([])
    }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      // 검색어가 짧아지면 이전 결과를 바로 걷어낸다 (지연 시 엉뚱한 결과가 남는다).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPredictions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setPredictions(data.predictions ?? [])
      } catch {
        setPredictions([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [query])

  function handleSelect(name: string) {
    onChange(name)
    setOpen(false)
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border bg-bg2 focus:border-primary flex w-full items-center gap-2.5 rounded-2xl border px-4 py-3.5 text-left transition-colors"
      >
        <MapPinIcon size={16} className="text-ink3 flex-shrink-0" />
        <span className={`text-[15px] ${value ? 'text-ink' : 'text-ink3'}`}>
          {value || (locale === 'ko' ? '예: 제주도, 도쿄, 파리' : 'e.g. Jeju, Tokyo, Paris')}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[81] flex max-h-[80dvh] flex-col rounded-t-3xl bg-white">
            <div className="flex flex-shrink-0 justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-gray-200" />
            </div>

            <div className="flex-shrink-0 px-4 pb-3">
              <div className="border-border bg-bg2 flex items-center gap-2 rounded-2xl border px-3.5 py-3">
                <MapPinIcon size={16} className="text-ink3 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={locale === 'ko' ? '목적지 검색...' : 'Search destinations...'}
                  className="text-ink placeholder:text-ink3 flex-1 bg-transparent text-[15px] outline-none"
                />
                {searching && (
                  <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                )}
              </div>
            </div>

            <div className="bg-border h-px flex-shrink-0" />

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {!query && (
                <>
                  <p className="text-ink3 mb-3 text-[12px] font-semibold">
                    {locale === 'ko' ? '인기 여행지' : 'Popular destinations'}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {DESTINATIONS.map((dest) => {
                      const label = destinationName(dest, locale)
                      const imgUrl = destinationPhotoUrl(dest.photoId, 160)
                      const failed = imgErrors.has(dest.ko)
                      const isSelected = value === dest.ko
                      return (
                        <button
                          key={dest.ko}
                          type="button"
                          onClick={() => handleSelect(dest.ko)}
                          className={`relative overflow-hidden rounded-xl text-left transition-opacity active:opacity-80 ${isSelected ? 'ring-primary ring-2 ring-offset-1' : ''}`}
                          style={{ aspectRatio: '1' }}
                        >
                          {/* 배경 그라디언트 */}
                          <div className="absolute inset-0 bg-gray-400" />
                          {/* 이미지 실패 시 아이콘 */}
                          {failed && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <MapPinIcon size={22} className="text-white/50" />
                            </div>
                          )}
                          {/* 사진 */}
                          {!failed && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgUrl}
                              alt={label}
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={() => setImgErrors((p) => new Set(p).add(dest.ko))}
                            />
                          )}
                          {/* 다크 오버레이 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          {/* 텍스트 */}
                          <div className="absolute right-0 bottom-0 left-0 p-1.5">
                            <p className="text-[11px] leading-tight font-bold text-white">
                              {label}
                            </p>
                            <p className="text-[9px] leading-tight text-white/60">
                              {destinationRegion(dest, locale)}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="bg-primary absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full">
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path
                                  d="M1.5 4l2 2 3-3"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {predictions.length > 0 && (
                <div className="divide-border divide-y">
                  {predictions.map((p) => (
                    <button
                      key={p.placeId}
                      type="button"
                      onClick={() => handleSelect(p.mainText)}
                      className="active:bg-bg2 flex w-full items-center gap-3 py-3 text-left"
                    >
                      <div className="bg-bg2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                        <MapPinIcon size={15} className="text-ink3" />
                      </div>
                      <div>
                        <p className="text-ink text-[14px] font-semibold">{p.mainText}</p>
                        {p.secondaryText && (
                          <p className="text-ink3 text-[12px]">{p.secondaryText}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query.length >= 2 && !searching && predictions.length === 0 && (
                <p className="text-ink3 py-8 text-center text-[13px]">
                  {locale === 'ko' ? '검색 결과가 없어요' : 'No results'}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

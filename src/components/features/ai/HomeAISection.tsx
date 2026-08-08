'use client'

import { useState, useRef } from 'react'
import { useLocale } from 'next-intl'
import MarkdownContent from '@/components/ui/MarkdownContent'

export default function HomeAISection() {
  const locale = useLocale() as 'ko' | 'en'
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const isKo = locale === 'ko'

  async function fetchRecommend() {
    if (loading) return
    setText('')
    setDone(false)
    setLoading(true)
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
        signal: abortRef.current.signal,
      })
      if (!res.ok || !res.body) throw new Error('failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        setText((prev) => prev + decoder.decode(value, { stream: true }))
      }
      setDone(true)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setText(isKo ? '추천을 불러오지 못했어요. 다시 시도해주세요.' : 'Failed to load. Please try again.')
        setDone(true)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    setOpen(true)
    if (!text && !loading) fetchRecommend()
  }

  function handleClose() {
    abortRef.current?.abort()
    setOpen(false)
  }

  return (
    <>
      {/* 배너 버튼 */}
      <button
        onClick={handleOpen}
        className="relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl p-4 text-left transition-opacity"
        style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)' }}
      >
        <svg
          aria-hidden
          viewBox="0 0 48 48"
          style={{ position: 'absolute', right: -8, top: -10, width: 72, height: 72, opacity: 0.15 }}
        >
          <g transform="translate(10 9)">
            <path d="M3 24L23 4L18 24L12 17Z" fill="white" />
            <path d="M17 25L20 30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
          <span className="text-[22px]">✨</span>
        </div>
        <div className="relative flex-1">
          <p className="text-[14px] font-bold text-white">
            {isKo ? 'AI 취향 추천' : 'AI Recommendations'}
          </p>
          <p className="text-[12px] text-white/60">
            {isKo ? '백로그·좋아요 기반으로 딱 맞는 장소' : 'Places matched to your taste'}
          </p>
        </div>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0">
          <path d="M7 4l5 5-5 5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* 팝업 오버레이 */}
      {open && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/40" onClick={handleClose} />
          <div className="fixed inset-x-0 bottom-0 z-[81] flex max-h-[75dvh] flex-col rounded-t-3xl bg-white">
            {/* 핸들 */}
            <div className="flex flex-shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-gray-200" />
            </div>

            {/* 헤더 */}
            <div className="flex flex-shrink-0 items-center justify-between px-5 pb-3 pt-1">
              <div>
                <p className="text-[17px] font-bold text-ink">
                  {isKo ? '✨ AI 취향 추천' : '✨ AI Recommendations'}
                </p>
                <p className="text-[12px] text-ink3">
                  {isKo ? '나의 취향 기반 맞춤 장소' : 'Personalized to your taste'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="#666" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="h-px bg-border flex-shrink-0" />

            {/* 콘텐츠 */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading && !text && (
                <div className="flex items-center gap-2 text-[13px] text-ink3">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  {isKo ? 'AI가 추천을 준비하고 있어요...' : 'Preparing recommendations...'}
                </div>
              )}

              {text && (
                <>
                  <MarkdownContent text={text} />
                  {loading && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-ink2 align-text-bottom" />
                  )}
                </>
              )}
            </div>

            {/* 하단 버튼 */}
            {done && (
              <div className="flex-shrink-0 border-t border-border px-4 py-3 pb-safe">
                <button
                  onClick={() => { setText(''); setDone(false); fetchRecommend() }}
                  className="w-full rounded-2xl border border-border py-3 text-[14px] font-semibold text-ink2"
                >
                  {isKo ? '다시 추천 받기' : 'Refresh'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

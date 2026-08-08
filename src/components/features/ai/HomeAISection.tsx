'use client'

import { useState, useRef } from 'react'
import { useLocale } from 'next-intl'

export default function HomeAISection() {
  const locale = useLocale() as 'ko' | 'en'
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function fetchRecommend() {
    if (loading) return
    setText('')
    setDone(false)
    setLoading(true)

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
        setText(locale === 'ko' ? '추천을 불러오지 못했어요. 다시 시도해주세요.' : 'Failed to load recommendations. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    abortRef.current?.abort()
    setText('')
    setDone(false)
    setLoading(false)
  }

  const isKo = locale === 'ko'

  return (
    <div>
      {/* AI 취향 추천 배너 */}
      <button
        onClick={fetchRecommend}
        disabled={loading}
        className="relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl p-4 text-left transition-opacity disabled:opacity-80"
        style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)' }}
      >
        {/* 우상단 워터마크 */}
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
        {loading ? (
          <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0">
            <path d="M7 4l5 5-5 5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* 결과 카드 — 스트리밍 후 표시 */}
      {(text || loading) && (
        <div className="mt-2 rounded-2xl border border-border bg-white px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-ink3">
              {isKo ? 'AI 추천 결과' : 'AI Results'}
            </p>
            <button onClick={reset} className="text-[12px] text-ink3">
              {isKo ? '닫기' : 'Close'}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-[14px] leading-[1.75] text-ink">
            {text}
            {loading && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-ink2 align-text-bottom" />
            )}
          </p>
          {done && (
            <button onClick={fetchRecommend} className="mt-2 text-[13px] font-medium text-primary">
              {isKo ? '다시 추천 받기 →' : 'Refresh →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

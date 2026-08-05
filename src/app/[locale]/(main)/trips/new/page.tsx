'use client'

import { useState, useTransition } from 'react'
import AppHeader from '@/components/common/AppHeader'
import { createTrip } from '@/app/actions/trip'
import { MapPinIcon } from '@/components/icons'

const COVER_PRESETS = [
  'linear-gradient(135deg, #0c1f45 0%, #1B6FF0 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #e94560 100%)',
  'linear-gradient(135deg, #0f3460 0%, #533483 100%)',
  'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
  'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
]

const INPUT_CLASS =
  'w-full rounded-2xl border border-[#E8EAED] bg-[#F7F8FA] px-4 py-3.5 text-[15px] text-[#0F1117] placeholder:text-[#C0C6D0] outline-none focus:border-[#1B6FF0] focus:bg-white transition-colors'

export default function NewTripPage() {
  const [isPending, startTransition] = useTransition()
  const [selectedCover, setSelectedCover] = useState(COVER_PRESETS[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    const fd = new FormData(e.currentTarget)
    fd.set('cover_url', selectedCover)
    startTransition(async () => {
      const result = await createTrip(fd)
      if (result?.error) setErrorMsg(result.error)
    })
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <AppHeader title="새 여행" onBack="router" />

      {/* 커버 미리보기 */}
      <div
        className="h-32 flex-shrink-0 transition-all duration-500"
        style={{ background: selectedCover }}
      />

      <form
        id="new-trip-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 px-4 py-5 pb-32"
      >
        {/* 커버 선택 */}
        <div>
          <p className="mb-3 text-[13px] font-semibold text-[#0F1117]">커버 선택</p>
          <div className="grid grid-cols-5 gap-2">
            {COVER_PRESETS.map((gradient) => (
              <button
                key={gradient}
                type="button"
                onClick={() => setSelectedCover(gradient)}
                className="relative h-10 rounded-xl"
                style={{ background: gradient }}
              >
                {selectedCover === gradient && (
                  <span className="absolute inset-0 rounded-xl ring-2 ring-[#1B6FF0] ring-offset-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 여행 제목 */}
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-[#0F1117]">여행 제목</label>
          <input
            name="title"
            type="text"
            required
            maxLength={60}
            placeholder="예: 제주도 힐링 여행"
            className={INPUT_CLASS}
          />
        </div>

        {/* 목적지 */}
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-[#0F1117]">목적지</label>
          <div className="relative">
            <MapPinIcon
              size={16}
              className="absolute top-1/2 left-4 -translate-y-1/2 text-[#9099A8]"
            />
            <input
              name="destination"
              type="text"
              maxLength={60}
              placeholder="예: 제주도, 도쿄, 파리"
              className={`${INPUT_CLASS} pl-10`}
            />
          </div>
        </div>

        {/* 날짜 */}
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-[#0F1117]">여행 날짜</label>
          <div className="flex items-center gap-2">
            <input
              name="start_date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (endDate && e.target.value > endDate) setEndDate('')
              }}
              className="flex-1 rounded-2xl border border-[#E8EAED] bg-[#F7F8FA] px-4 py-3.5 text-[15px] text-[#0F1117] transition-colors outline-none focus:border-[#1B6FF0] focus:bg-white"
            />
            <span className="text-[13px] text-[#C0C6D0]">~</span>
            <input
              name="end_date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 rounded-2xl border border-[#E8EAED] bg-[#F7F8FA] px-4 py-3.5 text-[15px] text-[#0F1117] transition-colors outline-none focus:border-[#1B6FF0] focus:bg-white"
            />
          </div>
          <p className="mt-1.5 text-[12px] text-[#9099A8]">날짜는 나중에 설정할 수 있어요</p>
        </div>

        {errorMsg && <p className="text-center text-[13px] text-red-500">{errorMsg}</p>}
      </form>

      {/* 하단 고정 버튼 */}
      <div className="fixed right-0 bottom-0 left-0 border-t border-[#F0F1F3] bg-white px-4 pt-3 pb-8">
        <button
          form="new-trip-form"
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl bg-[#1B6FF0] py-4 text-[16px] font-bold text-white disabled:opacity-60"
        >
          {isPending ? '만드는 중...' : '여행 만들기'}
        </button>
      </div>
    </div>
  )
}

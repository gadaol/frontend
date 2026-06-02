'use client'

import { useActionState } from 'react'
import { createTrip, type CreateTripState } from '@/app/actions/trips'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const initialState: CreateTripState = {}

export function CreateTripForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createTrip, initialState)

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => router.back()} className="p-1 text-ink" aria-label="뒤로가기">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-ink">여행 만들기</h1>
      </header>

      <form action={formAction} className="flex flex-1 flex-col gap-6 px-4 py-2">
        {/* 전체 에러 */}
        {state.errors?._form && (
          <div className="rounded-btn bg-primary-light px-4 py-3 text-sm text-primary">
            {state.errors._form[0]}
          </div>
        )}

        {/* 여행 이름 */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-ink">
            여행 이름 <span className="text-primary">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="어떤 여행인가요?"
            maxLength={50}
            autoComplete="off"
            className="h-12 rounded-btn border border-border px-4 text-sm text-ink placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {state.errors?.title && (
            <p className="text-xs text-primary">{state.errors.title[0]}</p>
          )}
        </div>

        {/* 날짜 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">여행 기간 (선택)</label>
          <div className="flex items-center gap-3">
            <input
              id="start_date"
              name="start_date"
              type="date"
              className="flex-1 h-12 rounded-btn border border-border px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-sm text-tertiary">~</span>
            <input
              id="end_date"
              name="end_date"
              type="date"
              className="flex-1 h-12 rounded-btn border border-border px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* 제출 */}
        <div className="mt-auto pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-primary text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isPending ? '만드는 중...' : '여행 만들기'}
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import StepIndicator from './StepIndicator'

const MAX = 12

interface Props {
  nickname: string
  onChange: (v: string) => void
  onNext: () => void
  redirectTo?: string | null
}

export default function NicknameStep({ nickname, onChange, onNext, redirectTo }: Props) {
  const t = useTranslations('onboarding')
  const router = useRouter()
  const locale = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSkip = async () => {
    await markOnboardingComplete()
    router.push(redirectTo ?? `/${locale}/home`)
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-8">
      <div className="flex items-center justify-between py-5">
        <StepIndicator current={1} total={3} />
        <button onClick={handleSkip} className="text-[14px] font-medium text-[#9099A8]">
          {t('skip')}
        </button>
      </div>

      <div className="mb-8">
        <div className="mb-1.5 text-[13px] font-medium text-[#1B6FF0]">{t('step1Label')}</div>
        <h1 className="mb-2 text-[24px] leading-snug font-bold text-[#0F1117]">
          {t('step1Title')}
        </h1>
        <p className="text-[14px] leading-relaxed text-[#9099A8]">{t('step1Subtitle')}</p>
      </div>

      <div className="mb-8 flex flex-col items-center gap-3">
        <button className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1B6FF0] to-[#0D3E8A] text-[28px] font-bold text-white">
            {nickname ? nickname[0].toUpperCase() : '?'}
          </div>
          <div className="absolute right-0 bottom-0 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-[#E8EAED] bg-white">
            <CameraIcon />
          </div>
        </button>
        <span className="text-[12px] text-[#9099A8]">{t('avatarHint')}</span>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-[13px] font-medium text-[#0F1117]">
          {t('nicknameLabel')}
        </label>
        <div
          className="flex h-[52px] cursor-text items-center rounded-xl border-[1.5px] border-[#1B6FF0] bg-white px-4 shadow-[0_0_0_3px_rgba(27,111,240,0.1)]"
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            value={nickname}
            onChange={(e) => onChange(e.target.value.slice(0, MAX))}
            placeholder={t('nicknamePlaceholder')}
            className="flex-1 bg-transparent text-[15px] text-[#0F1117] outline-none placeholder:text-[#C5CAD3]"
          />
          <span className="text-[12px] text-[#9099A8]">
            {nickname.length}/{MAX}
          </span>
        </div>
      </div>

      <div className="mt-auto">
        <button
          onClick={onNext}
          disabled={nickname.trim().length === 0}
          className="flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1B6FF0] text-[16px] font-semibold text-white disabled:opacity-40"
        >
          {t('next')}
          <ChevronRight />
        </button>
      </div>
    </div>
  )
}

async function markOnboardingComplete() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
}

function CameraIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z"
        stroke="#515966"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M7 4l5 5-5 5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
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
        <button onClick={handleSkip} className="text-ink3 text-[14px] font-medium">
          {t('skip')}
        </button>
      </div>

      <div className="mb-8">
        <div className="text-primary mb-1.5 text-[13px] font-medium">{t('step1Label')}</div>
        <h1 className="text-ink mb-2 text-[24px] leading-snug font-bold">{t('step1Title')}</h1>
        <p className="text-ink3 text-[14px] leading-relaxed">{t('step1Subtitle')}</p>
      </div>

      <div className="mb-8 flex flex-col items-center gap-3">
        <button className="relative">
          <div className="from-primary flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br to-[#0D3E8A] text-[28px] font-bold text-white">
            {nickname ? nickname[0].toUpperCase() : '?'}
          </div>
          <div className="border-border absolute right-0 bottom-0 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 bg-white">
            <CameraIcon />
          </div>
        </button>
        <span className="text-ink3 text-[12px]">{t('avatarHint')}</span>
      </div>

      <div className="mb-6">
        <label className="text-ink mb-2 block text-[13px] font-medium">{t('nicknameLabel')}</label>
        <div
          className="border-primary flex h-[52px] cursor-text items-center rounded-xl border-[1.5px] bg-white px-4 shadow-[0_0_0_3px_rgba(27,111,240,0.1)]"
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            value={nickname}
            onChange={(e) => onChange(e.target.value.slice(0, MAX))}
            placeholder={t('nicknamePlaceholder')}
            className="text-ink placeholder:text-ink3 flex-1 bg-transparent text-[15px] outline-none"
          />
          <span className="text-ink3 text-[12px]">
            {nickname.length}/{MAX}
          </span>
        </div>
      </div>

      <div className="mt-auto">
        <Button onClick={onNext} disabled={nickname.trim().length === 0} fullWidth>
          {t('next')}
          <ChevronRight />
        </Button>
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
        stroke="var(--color-ink2)"
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

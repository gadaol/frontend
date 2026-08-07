'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { uploadAvatar } from '@/app/actions/mypage'
import Button from '@/components/ui/Button'
import StepIndicator from './StepIndicator'

const MAX = 12

interface Props {
  nickname: string
  onChange: (v: string) => void
  onBack: () => void
  onNext: () => void
}

export default function NicknameStep({ nickname, onChange, onBack, onNext }: Props) {
  const t = useTranslations('onboarding')
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadAvatar(fd)
    if (res.avatarUrl) setAvatarUrl(res.avatarUrl)
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-8">
      <div className="flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M13 16l-6-6 6-6"
                stroke="var(--color-ink3)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <StepIndicator current={2} total={3} />
        </div>
        <button onClick={onNext} className="text-ink3 text-[14px] font-medium">
          {t('skip')}
        </button>
      </div>

      <div className="mb-8">
        <div className="text-primary mb-1.5 text-[13px] font-medium">{t('step2Label')}</div>
        <h1 className="text-ink mb-2 text-[24px] leading-snug font-bold">{t('step1Title')}</h1>
        <p className="text-ink3 text-[14px] leading-relaxed">{t('step1Subtitle')}</p>
      </div>

      <div className="mb-8 flex flex-col items-center gap-3">
        <label className="relative cursor-pointer">
          <div className="h-20 w-20 overflow-hidden rounded-full">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="from-primary flex h-full w-full items-center justify-center bg-gradient-to-br to-[#0D3E8A] text-[28px] font-bold text-white">
                {nickname ? nickname[0].toUpperCase() : '?'}
              </div>
            )}
          </div>
          <div className="border-border absolute right-0 bottom-0 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 bg-white">
            {uploading ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            ) : (
              <CameraIcon />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={uploading}
          />
        </label>
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

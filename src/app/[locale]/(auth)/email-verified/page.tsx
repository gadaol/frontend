'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export default function EmailVerifiedPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#EBF2FF]">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M10 20l7 7 13-14"
            stroke="#1B6FF0"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="mb-2 text-[22px] font-bold text-[#0F1117]">{t('emailVerifiedTitle')}</h1>
      <p className="mb-10 text-center text-[14px] leading-relaxed text-[#9099A8]">
        {t('emailVerifiedDesc')}
      </p>

      <button
        onClick={() => router.replace(`/${locale}/onboarding`)}
        className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white"
      >
        {t('emailVerifiedAction')}
      </button>
    </div>
  )
}

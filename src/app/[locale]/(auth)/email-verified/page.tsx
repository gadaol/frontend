'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function EmailVerifiedPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6">
      <div className="bg-primary-light mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M10 20l7 7 13-14"
            stroke="var(--color-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="text-ink mb-2 text-[22px] font-bold">{t('emailVerifiedTitle')}</h1>
      <p className="text-ink3 mb-10 text-center text-[14px] leading-relaxed">
        {t('emailVerifiedDesc')}
      </p>

      <Button onClick={() => router.replace(`/${locale}/onboarding`)} fullWidth>
        {t('emailVerifiedAction')}
      </Button>
    </div>
  )
}

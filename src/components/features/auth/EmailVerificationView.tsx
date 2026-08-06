'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface Props {
  email: string
  onBack: () => void
}

export default function EmailVerificationView({ email, onBack }: Props) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    let mounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && event === 'SIGNED_IN' && session) router.push(`/${locale}/home`)
    })

    const interval = setInterval(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (mounted && session) router.push(`/${locale}/home`)
    }, 3000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleResend = async () => {
    setResending(true)
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? location.origin}/${locale}/auth/callback`,
      },
    })
    setResending(false)
    setResent(true)
    setTimeout(() => setResent(false), 3000)
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="border-border flex h-14 flex-shrink-0 items-center gap-1 border-b px-4">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center"
          aria-label={tc('back')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="var(--color-ink)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-ink text-[17px] font-semibold">{t('emailVerificationTitle')}</span>
      </div>

      <div className="flex flex-1 flex-col items-center px-8 pt-12 text-center">
        <div className="bg-primary-light mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect
              x="3"
              y="8"
              width="26"
              height="18"
              rx="3"
              stroke="var(--color-primary)"
              strokeWidth="2"
            />
            <path
              d="M3 12l13 8 13-8"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className="text-ink mb-2 text-[20px] font-bold">{t('emailVerificationTitle')}</h2>
        <p className="text-ink3 text-[14px] leading-relaxed">
          <span className="text-ink font-medium">{email}</span>
          {t('emailVerificationDesc')}
        </p>

        <button
          onClick={handleResend}
          disabled={resending}
          className="text-primary mt-8 text-[14px] font-medium disabled:opacity-50"
        >
          {resending ? t('processing') : t('resendEmail')}
        </button>

        {resent && <span className="text-primary mt-2 text-[13px]">{t('resendSuccess')}</span>}

        <div className="mt-auto w-full pt-8 pb-6">
          <Button variant="secondary" onClick={onBack} fullWidth>
            {t('backToLogin')}
          </Button>
        </div>
      </div>
    </div>
  )
}

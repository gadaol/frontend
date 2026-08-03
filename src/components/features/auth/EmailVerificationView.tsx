'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

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
      <div className="flex h-14 flex-shrink-0 items-center gap-1 border-b border-[#E8EAED] px-4">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center"
          aria-label={tc('back')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#0F1117"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-[17px] font-semibold text-[#0F1117]">
          {t('emailVerificationTitle')}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center px-8 pt-12 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF2FF]">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="3" y="8" width="26" height="18" rx="3" stroke="#1B6FF0" strokeWidth="2" />
            <path d="M3 12l13 8 13-8" stroke="#1B6FF0" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="mb-2 text-[20px] font-bold text-[#0F1117]">{t('emailVerificationTitle')}</h2>
        <p className="text-[14px] leading-relaxed text-[#9099A8]">
          <span className="font-medium text-[#0F1117]">{email}</span>
          {t('emailVerificationDesc')}
        </p>

        <button
          onClick={handleResend}
          disabled={resending}
          className="mt-8 text-[14px] font-medium text-[#1B6FF0] disabled:opacity-50"
        >
          {resending ? t('processing') : t('resendEmail')}
        </button>

        {resent && <span className="mt-2 text-[13px] text-[#1B6FF0]">{t('resendSuccess')}</span>}

        <div className="mt-auto w-full pt-8 pb-6">
          <button
            onClick={onBack}
            className="h-[52px] w-full rounded-xl border border-[#E8EAED] text-[15px] font-medium text-[#0F1117]"
          >
            {t('backToLogin')}
          </button>
        </div>
      </div>
    </div>
  )
}

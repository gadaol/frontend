'use client'

import { createClient } from '@/lib/supabase/client'
import { useLocale, useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import Logo from '@/components/common/Logo'

interface Props {
  onEmailClick: () => void
  errorMessage?: string | null
  redirectTo?: string | null
}

export default function SocialLoginView({ onEmailClick, errorMessage, redirectTo }: Props) {
  const t = useTranslations('auth')
  const supabase = createClient()
  const locale = useLocale()

  function callbackUrl() {
    const base = `${location.origin}/${locale}/auth/callback`
    return redirectTo ? `${base}?redirect_to=${encodeURIComponent(redirectTo)}` : base
  }

  const signInWithKakao = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: callbackUrl(),
        scopes: 'profile_nickname profile_image',
      },
    })
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[linear-gradient(170deg,var(--color-hero-top)_0%,var(--color-hero-bot)_100%)]">
      <div className="flex flex-col items-center px-7 pt-12 pb-8 text-center">
        <Logo size={48} variant="dark" className="mb-3" />
        <div className="mb-2 text-4xl font-extrabold tracking-tighter text-white">gadaol</div>
        <div className="text-sm text-white/45">{t('tagline')}</div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto rounded-t-[28px] bg-white px-6 pt-8 pb-10">
        <div className="text-ink mb-1 text-[22px] font-bold tracking-tight">{t('title')}</div>
        <div className="text-ink3 mb-4 text-sm">{t('subtitle')}</div>
        {errorMessage && (
          <div className="text-error bg-error-light mb-4 rounded-xl px-4 py-3 text-[13px]">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button variant="kakao" onClick={signInWithKakao} fullWidth>
            <KakaoIcon />
            {t('kakao')}
          </Button>

          <Button variant="google" onClick={signInWithGoogle} fullWidth>
            <GoogleIcon />
            {t('google')}
          </Button>

          <div className="text-ink3 flex items-center gap-3 text-[13px]">
            <span className="bg-border h-px flex-1" />
            {t('or')}
            <span className="bg-border h-px flex-1" />
          </div>

          <Button variant="email" onClick={onEmailClick} fullWidth>
            <EmailIcon />
            {t('email')}
          </Button>
        </div>

        <p className="text-ink3 mt-5 text-center text-[12px] leading-relaxed">
          {t.rich('termsNotice', {
            termsLink: (chunks) => (
              <button type="button" className="text-primary">
                {chunks}
              </button>
            ),
            privacyLink: (chunks) => (
              <button type="button" className="text-primary">
                {chunks}
              </button>
            ),
          })}
        </p>
      </div>
    </div>
  )
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.38c0 2.09 1.32 3.93 3.31 4.97L3.9 15l3.6-2.37c.49.07.99.1 1.5.1 4.14 0 7.5-2.64 7.5-5.88S13.14 1.5 9 1.5z"
        fill="var(--color-kakao-ink)"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6A7.8 7.8 0 0016.51 8z"
        fill="#4285F4"
      />
      <path
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.77-2.7.77a4.76 4.76 0 01-4.49-3.27H1.8v2.07A8 8 0 008.98 17z"
        fill="#34A853"
      />
      <path d="M4.49 10.55a4.8 4.8 0 010-3.1V5.38H1.8a8 8 0 000 7.24l2.69-2.07z" fill="#FBBC05" />
      <path
        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.8 5.39l2.69 2.07a4.76 4.76 0 014.49-3.28z"
        fill="#EA4335"
      />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="4" width="16" height="11" rx="2" stroke="white" strokeWidth="1.5" />
      <path d="M1 6l8 5 8-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

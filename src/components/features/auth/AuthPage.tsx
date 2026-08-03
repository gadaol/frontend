'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SocialLoginView from './SocialLoginView'
import EmailLoginView from './EmailLoginView'
import SignUpView from './SignUpView'
import EmailVerificationView from './EmailVerificationView'
import ForgotPasswordView from './ForgotPasswordView'
import FindAccountView from './FindAccountView'

type View =
  | 'social'
  | 'email'
  | 'signup'
  | 'email-verification'
  | 'forgot-password'
  | 'find-account'

export default function AuthPage() {
  const [view, setView] = useState<View>('social')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [socialError, setSocialError] = useState<string | null>(null)
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth')
  const supabase = createClient()

  useEffect(() => {
    const error = searchParams.get('error')
    const provider = searchParams.get('provider')
    if (error === 'duplicate_account') {
      if (provider === 'kakao') setSocialError(t('duplicateAccountKakao'))
      else if (provider === 'google') setSocialError(t('duplicateAccountGoogle'))
      else if (provider === 'email') setSocialError(t('duplicateAccountEmail'))
      else setSocialError(t('duplicateAccount'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace(`/${locale}/reset-password`)
      }
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-dvh flex-col">
      {view === 'social' && (
        <SocialLoginView onEmailClick={() => setView('email')} errorMessage={socialError} />
      )}
      {view === 'email' && (
        <EmailLoginView
          onBack={() => setView('social')}
          onSignUp={() => setView('signup')}
          onForgotPassword={() => setView('forgot-password')}
          onFindAccount={() => setView('find-account')}
          onVerificationSent={(email) => {
            setVerificationEmail(email)
            setView('email-verification')
          }}
        />
      )}
      {view === 'signup' && (
        <SignUpView
          onBack={() => setView('email')}
          onVerificationSent={(email) => {
            setVerificationEmail(email)
            setView('email-verification')
          }}
        />
      )}
      {view === 'email-verification' && (
        <EmailVerificationView email={verificationEmail} onBack={() => setView('signup')} />
      )}
      {view === 'forgot-password' && <ForgotPasswordView onBack={() => setView('email')} />}
      {view === 'find-account' && (
        <FindAccountView onBack={() => setView('email')} onGoToLogin={() => setView('email')} />
      )}
    </div>
  )
}

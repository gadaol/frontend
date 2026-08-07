'use client'

import { useEffect, useState, useMemo } from 'react'
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
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth')
  const supabase = createClient()

  const initialError = useMemo(() => {
    const error = searchParams.get('error')
    const provider = searchParams.get('provider')
    if (error === 'duplicate_account') {
      if (provider === 'kakao') return t('duplicateAccountKakao')
      if (provider === 'google') return t('duplicateAccountGoogle')
      if (provider === 'email') return t('duplicateAccountEmail')
      return t('duplicateAccount')
    }
    if (error === 'use_primary_account') {
      if (provider === 'kakao') return t('usePrimaryAccountKakao')
      if (provider === 'google') return t('usePrimaryAccountGoogle')
      if (provider === 'email') return t('usePrimaryAccountEmail')
      return t('usePrimaryAccount')
    }
    if (error === 'email_exists') {
      return t('emailExistsError')
    }
    return null
    // searchParams, t는 마운트 시점 스냅샷으로만 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const socialError = initialError

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        fetch('/api/set-reset-cookie', { method: 'POST' }).finally(() => {
          router.replace(`/${locale}/reset-password`)
        })
      }
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-dvh flex-col">
      {view === 'social' && (
        <SocialLoginView
          onEmailClick={() => setView('email')}
          onFindAccount={() => setView('find-account')}
          onForgotPassword={() => setView('forgot-password')}
          errorMessage={socialError}
          redirectTo={searchParams.get('redirectTo')}
        />
      )}
      {view === 'email' && (
        <EmailLoginView
          onBack={() => setView('social')}
          onSignUp={() => setView('signup')}
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
      {view === 'forgot-password' && <ForgotPasswordView onBack={() => setView('social')} />}
      {view === 'find-account' && (
        <FindAccountView onBack={() => setView('social')} onGoToLogin={() => setView('social')} />
      )}
    </div>
  )
}

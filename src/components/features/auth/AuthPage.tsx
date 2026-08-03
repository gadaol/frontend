'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
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
  const supabase = createClient()

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
      {view === 'social' && <SocialLoginView onEmailClick={() => setView('email')} />}
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

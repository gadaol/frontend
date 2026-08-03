'use client'

import { useState } from 'react'
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

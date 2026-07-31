'use client'

import { useState } from 'react'
import SocialLoginView from './SocialLoginView'
import EmailLoginView from './EmailLoginView'

type View = 'social' | 'email'

export default function AuthPage() {
  const [view, setView] = useState<View>('social')

  return (
    <div className="flex h-full flex-col">
      {view === 'social' && <SocialLoginView onEmailClick={() => setView('email')} />}
      {view === 'email' && <EmailLoginView onBack={() => setView('social')} />}
    </div>
  )
}

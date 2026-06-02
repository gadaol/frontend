'use client'

import { useState } from 'react'
import { signInWithGoogle } from '@/app/actions/auth'

export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    const result = await signInWithGoogle()

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.url) {
      window.location.href = result.url
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-center text-xs text-primary">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-btn border border-border bg-white text-sm font-medium text-ink shadow-sm transition-colors hover:bg-bg-subtle active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        ) : (
          <GoogleIcon />
        )}
        {loading ? '로그인 중...' : 'Google로 계속하기'}
      </button>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.77-2.7.77-2.08 0-3.84-1.4-4.47-3.29H1.83v2.07A8 8 0 0 0 8.98 17Z"
      />
      <path
        fill="#FBBC05"
        d="M4.51 10.53A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.04.25-1.53V5.4H1.83A8 8 0 0 0 .98 9c0 1.29.31 2.51.85 3.6l2.68-2.07Z"
      />
      <path
        fill="#EA4335"
        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 .98 9l2.85 2.07C4.14 9.58 5.9 4.18 8.98 4.18Z"
      />
    </svg>
  )
}

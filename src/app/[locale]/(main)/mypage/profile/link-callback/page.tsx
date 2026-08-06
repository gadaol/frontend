'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

function getErrorCode() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return (
    params.get('error_code') ?? new URLSearchParams(window.location.hash.slice(1)).get('error_code')
  )
}

export default function LinkCallbackPage() {
  const router = useRouter()
  const locale = useLocale()
  const [isError] = useState(() => getErrorCode() === 'identity_already_exists')

  useEffect(() => {
    if (isError) return

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) {
      router.replace(`/${locale}/mypage/profile`)
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(() => {
      router.replace(`/${locale}/mypage/profile`)
    })
  }, [isError, locale, router])

  if (isError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#F5F6F8] px-6">
        <p className="text-center text-[14px] whitespace-pre-line text-[#F04438]">
          {
            '이미 다른 계정에 연동된 소셜 계정이에요.\n해당 소셜 계정으로 로그인 후 프로필에서 연동을 해제하거나,\n다른 소셜 계정을 사용해주세요.'
          }
        </p>
        <button
          onClick={() => router.replace(`/${locale}/mypage/profile`)}
          className="rounded-2xl bg-[#1B6FF0] px-6 py-3 text-[14px] font-semibold text-white"
        >
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F5F6F8]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1B6FF0] border-t-transparent" />
    </div>
  )
}

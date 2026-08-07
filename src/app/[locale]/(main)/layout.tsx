'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    const handler = () => router.replace(`/${locale}`)
    window.addEventListener('auth:unauthorized', handler)
    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [router, locale])

  return <>{children}</>
}

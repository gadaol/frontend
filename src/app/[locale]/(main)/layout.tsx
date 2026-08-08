'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import AssistantPanel from '@/components/features/ai/AssistantPanel'
import { usePlanStore } from '@/lib/planStore'
import type { Plan } from '@/utils/plans'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const locale = useLocale()
  const setPlan = usePlanStore((s) => s.setPlan)

  useEffect(() => {
    const handler = () => router.replace(`/${locale}`)
    window.addEventListener('auth:unauthorized', handler)
    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [router, locale])

  useEffect(() => {
    fetch('/api/user/plan')
      .then((r) => r.json())
      .then((d) => { if (d?.plan) setPlan(d.plan as Plan) })
      .catch(() => null)
  }, [setPlan])

  return (
    <>
      {children}
      <AssistantPanel />
    </>
  )
}

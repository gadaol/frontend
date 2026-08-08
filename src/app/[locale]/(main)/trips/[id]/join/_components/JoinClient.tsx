'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import { acceptInvite } from '@/app/actions/invite'

interface Props {
  token: string
  alreadyMember: boolean
}

export default function JoinClient({ token, alreadyMember }: Props) {
  const t = useTranslations('trips')
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (alreadyMember) {
    return (
      <button
        onClick={() => router.back()}
        className="text-primary bg-primary-light w-full rounded-2xl py-4 text-[16px] font-bold"
      >
        {t('alreadyJoined')}
      </button>
    )
  }

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptInvite(token)
      if (result.error) {
        setError(t('joinFailed'))
        return
      }
      router.replace(`/${locale}/trips/${result.tripId}`)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-center text-[13px] text-red-500">{error}</p>}
      <Button onClick={handleAccept} disabled={isPending} fullWidth>
        {isPending ? t('joining') : t('joinTrip')}
      </Button>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import Button from '@/components/ui/Button'
import { acceptInvite } from '@/app/actions/invite'

interface Props {
  token: string
  alreadyMember: boolean
}

export default function JoinClient({ token, alreadyMember }: Props) {
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
        이미 참여 중이에요 · 돌아가기
      </button>
    )
  }

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptInvite(token)
      if (result.error) {
        setError('참여에 실패했어요. 다시 시도해주세요.')
        return
      }
      router.replace(`/${locale}/trips/${result.tripId}`)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-center text-[13px] text-red-500">{error}</p>}
      <Button onClick={handleAccept} disabled={isPending} fullWidth>
        {isPending ? '참여 중...' : '여행 참여하기'}
      </Button>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
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
        className="w-full rounded-2xl bg-[#F0F4FF] py-4 text-[16px] font-bold text-[#1B6FF0]"
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
      <button
        onClick={handleAccept}
        disabled={isPending}
        className="w-full rounded-2xl bg-[#1B6FF0] py-4 text-[16px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? '참여 중...' : '여행 참여하기'}
      </button>
    </div>
  )
}

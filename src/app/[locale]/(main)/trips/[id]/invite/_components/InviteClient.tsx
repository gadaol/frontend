'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface Props {
  tripId: string
  tripTitle: string
  inviteToken: string | null
}

export default function InviteClient({ tripId, tripTitle, inviteToken }: Props) {
  const router = useRouter()
  const [copyToast, setCopyToast] = useState(false)
  const inviteUrl =
    typeof window !== 'undefined' && inviteToken
      ? `${window.location.origin}/${window.location.pathname.split('/')[1]}/trips/${tripId}/join?token=${inviteToken}`
      : null

  async function handleShareLink() {
    if (!inviteUrl) return
    if (navigator.share) {
      try {
        await navigator.share({ title: `${tripTitle} 여행에 초대합니다`, url: inviteUrl })
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  function handleCopy() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl).catch(() => null)
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 2500)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {copyToast && (
        <div className="bg-ink fixed top-14 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-medium text-white shadow-lg">
          초대 링크가 복사됐어요
        </div>
      )}

      {/* 헤더 */}
      <div className="border-border flex h-[54px] items-center gap-3 border-b px-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 5l-5 5 5 5"
              stroke="var(--color-ink)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="text-ink text-[17px] font-bold">메이트 초대</h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        {/* 아이콘 */}
        <div className="bg-primary-light mb-6 flex h-20 w-20 items-center justify-center rounded-[24px]">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="14" cy="11" r="6" stroke="var(--color-primary)" strokeWidth="2" />
            <path
              d="M4 30c0-5.52 4.48-10 10-10"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M26 20v10M21 25h10"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className="text-ink mb-2 text-[20px] font-bold">링크로 초대하기</h2>
        <p className="text-ink3 mb-10 text-[14px] leading-relaxed">
          링크를 공유해서 메이트를 초대하세요.{'\n'}
          링크를 받은 사람은 가입 후 여행에 참여할 수 있어요.
        </p>

        {inviteUrl ? (
          <div className="w-full space-y-3">
            <div className="border-border bg-bg2 rounded-2xl border px-4 py-3">
              <p className="text-ink3 text-[12px] break-all">{inviteUrl}</p>
            </div>
            <div className="flex gap-2.5">
              <Button variant="secondary" onClick={handleCopy} className="flex-1">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect
                    x="6"
                    y="6"
                    width="9"
                    height="10"
                    rx="1.5"
                    stroke="var(--color-ink2)"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M3 12V4a1.5 1.5 0 011.5-1.5H12"
                    stroke="var(--color-ink2)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                링크 복사
              </Button>
              <Button onClick={handleShareLink} className="flex-1">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="14" cy="4" r="2" stroke="white" strokeWidth="1.4" />
                  <circle cx="14" cy="14" r="2" stroke="white" strokeWidth="1.4" />
                  <circle cx="4" cy="9" r="2" stroke="white" strokeWidth="1.4" />
                  <path
                    d="M5.9 8l6.2-3M5.9 10l6.2 3"
                    stroke="white"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                공유하기
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-ink3 text-[13px]">링크를 생성할 수 없어요</p>
        )}
      </div>
    </div>
  )
}

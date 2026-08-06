'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  tripId: string
  tripTitle: string
  inviteToken: string | null
}

export default function InviteClient({ tripId, tripTitle, inviteToken }: Props) {
  const router = useRouter()
  const [copyToast, setCopyToast] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!inviteToken) return
    const locale = window.location.pathname.split('/')[1]
    setInviteUrl(`${window.location.origin}/${locale}/trips/${tripId}/join?token=${inviteToken}`)
  }, [inviteToken, tripId])

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
        <div className="fixed top-14 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#0F1117] px-4 py-2 text-[13px] font-medium text-white shadow-lg">
          초대 링크가 복사됐어요
        </div>
      )}

      {/* 헤더 */}
      <div className="flex h-[54px] items-center gap-3 border-b border-[#E8EAED] px-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 5l-5 5 5 5"
              stroke="#0F1117"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-[#0F1117]">메이트 초대</h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        {/* 아이콘 */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#EBF2FF]">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="14" cy="11" r="6" stroke="#1B6FF0" strokeWidth="2" />
            <path d="M4 30c0-5.52 4.48-10 10-10" stroke="#1B6FF0" strokeWidth="2" strokeLinecap="round" />
            <path d="M26 20v10M21 25h10" stroke="#1B6FF0" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="mb-2 text-[20px] font-bold text-[#0F1117]">링크로 초대하기</h2>
        <p className="mb-10 text-[14px] leading-relaxed text-[#9099A8]">
          링크를 공유해서 메이트를 초대하세요.{'\n'}
          링크를 받은 사람은 가입 후 여행에 참여할 수 있어요.
        </p>

        {inviteUrl ? (
          <div className="w-full space-y-3">
            <div className="rounded-2xl border border-[#E8EAED] bg-[#F5F7FA] px-4 py-3">
              <p className="break-all text-[12px] text-[#9099A8]">{inviteUrl}</p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#E8EAED] bg-white py-4 text-[15px] font-semibold text-[#515966]"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="6" y="6" width="9" height="10" rx="1.5" stroke="#515966" strokeWidth="1.4" />
                  <path d="M3 12V4a1.5 1.5 0 011.5-1.5H12" stroke="#515966" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                링크 복사
              </button>
              <button
                onClick={handleShareLink}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1B6FF0] py-4 text-[15px] font-semibold text-white"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="14" cy="4" r="2" stroke="white" strokeWidth="1.4" />
                  <circle cx="14" cy="14" r="2" stroke="white" strokeWidth="1.4" />
                  <circle cx="4" cy="9" r="2" stroke="white" strokeWidth="1.4" />
                  <path d="M5.9 8l6.2-3M5.9 10l6.2 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                공유하기
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[#9099A8]">링크를 생성할 수 없어요</p>
        )}
      </div>
    </div>
  )
}

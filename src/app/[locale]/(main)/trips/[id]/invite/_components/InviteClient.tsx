'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { searchUsers, sendDirectInvite, type UserSearchResult } from '@/app/actions/invite'

const AVATAR_COLORS = ['#1B6FF0', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2']

interface Props {
  tripId: string
  tripTitle: string
  inviteUrl: string | null
  memberIds: string[]
}

export default function InviteClient({ tripId, tripTitle, inviteUrl, memberIds }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const [copyToast, setCopyToast] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await searchUsers(tripId, value)
      setResults(res)
      setSearching(false)
    }, 300)
  }

  function handleInvite(userId: string) {
    startTransition(async () => {
      const res = await sendDirectInvite(tripId, userId)
      if (!res.error || res.error === 'already_invited') {
        setInvitedIds((prev) => new Set(prev).add(userId))
        setResults((prev) =>
          prev.map((r) => (r.id === userId ? { ...r, alreadyInvited: true } : r)),
        )
      }
    })
  }

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

      <div className="flex-1 px-4 pt-5">
        {/* 유저 검색 */}
        <p className="mb-2 text-[13px] font-semibold text-[#515966]">앱에서 찾기</p>
        <div className="relative mb-4">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#9099A8]"
          >
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="이름으로 검색"
            className="w-full rounded-xl border border-[#E8EAED] bg-[#F5F7FA] py-3 pl-9 pr-4 text-[14px] text-[#0F1117] placeholder:text-[#9099A8] focus:border-[#1B6FF0] focus:outline-none"
          />
          {searching && (
            <div className="absolute top-1/2 right-3.5 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1B6FF0] border-t-transparent" />
            </div>
          )}
        </div>

        {/* 검색 결과 */}
        {query.trim() && !searching && results.length === 0 && (
          <p className="py-6 text-center text-[13px] text-[#9099A8]">검색 결과가 없어요</p>
        )}

        {results.length > 0 && (
          <div className="mb-6 flex flex-col gap-2">
            {results.map((user, i) => {
              const alreadyDone = invitedIds.has(user.id) || user.alreadyInvited
              const isMember = memberIds.includes(user.id)
              return (
                <div key={user.id} className="flex items-center gap-3 py-1">
                  <UserAvatar
                    name={user.name}
                    avatarUrl={user.avatar_url}
                    index={i}
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#0F1117] truncate">
                      {user.name ?? '이름 없음'}
                    </p>
                  </div>
                  {isMember ? (
                    <span className="rounded-full bg-[#F0F4FF] px-3 py-1.5 text-[12px] font-medium text-[#1B6FF0]">
                      이미 멤버
                    </span>
                  ) : alreadyDone ? (
                    <span className="rounded-full bg-[#F0F9F4] px-3 py-1.5 text-[12px] font-medium text-[#059669]">
                      초대 완료
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInvite(user.id)}
                      className="rounded-full bg-[#1B6FF0] px-3 py-1.5 text-[12px] font-semibold text-white"
                    >
                      초대
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 링크 공유 구분선 */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E8EAED]" />
          <span className="text-[12px] text-[#9099A8]">또는 링크로 초대</span>
          <div className="h-px flex-1 bg-[#E8EAED]" />
        </div>

        {/* 링크 공유 카드 */}
        {inviteUrl ? (
          <div className="rounded-2xl border border-[#E8EAED] bg-[#F5F7FA] p-4">
            <p className="mb-1 text-[13px] font-semibold text-[#0F1117]">초대 링크</p>
            <p className="mb-3 break-all text-[11px] text-[#9099A8]">{inviteUrl}</p>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E8EAED] bg-white py-3 text-[13px] font-semibold text-[#515966]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="5" width="8" height="9" rx="1.5" stroke="#515966" strokeWidth="1.3" />
                  <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" stroke="#515966" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                링크 복사
              </button>
              <button
                onClick={handleShareLink}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1B6FF0] py-3 text-[13px] font-semibold text-white"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="12" cy="3" r="1.5" stroke="white" strokeWidth="1.3" />
                  <circle cx="12" cy="13" r="1.5" stroke="white" strokeWidth="1.3" />
                  <circle cx="4" cy="8" r="1.5" stroke="white" strokeWidth="1.3" />
                  <path d="M5.4 7.3l5.2-3M5.4 8.7l5.2 3" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                공유하기
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-[13px] text-[#9099A8]">링크를 생성할 수 없어요</p>
        )}
      </div>
    </div>
  )
}

function UserAvatar({
  name,
  avatarUrl,
  index,
  size,
}: {
  name: string | null
  avatarUrl: string | null
  index: number
  size: number
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name ?? ''}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
      }}
    >
      {(name ?? '?')[0]}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateName, uploadAvatar, deleteAvatar } from '@/app/actions/mypage'
import AppHeader from '@/components/common/AppHeader'

interface Props {
  displayName: string
  initials: string
  avatarUrl: string | null
  linkedProviders: string[]
  currentProvider: string
}

export default function ProfileSettingsClient({
  displayName,
  initials,
  avatarUrl,
  linkedProviders,
  currentProvider,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [nameValue, setNameValue] = useState(displayName)
  const [nameError, setNameError] = useState('')
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl)
  const [avatarUploading, setAvatarUploading] = useState(false)

  function handleSaveName() {
    if (!nameValue.trim()) {
      setNameError('이름을 입력해주세요')
      return
    }
    startTransition(async () => {
      const res = await updateName(nameValue)
      if (res?.error) {
        setNameError('저장에 실패했어요')
      } else {
        setNameError('')
        router.back()
      }
    })
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadAvatar(fd)
    if (res.avatarUrl) setCurrentAvatarUrl(res.avatarUrl)
    setAvatarUploading(false)
    e.target.value = ''
  }

  async function handleDeleteAvatar() {
    setAvatarUploading(true)
    await deleteAvatar()
    setCurrentAvatarUrl(null)
    setAvatarUploading(false)
  }

  return (
    <div className="min-h-dvh bg-[#F5F6F8]">
      <AppHeader title="프로필 설정" onBack="router" border />

      <div className="px-4 pt-6 pb-10">
        {/* 아바타 */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <label className="relative cursor-pointer">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-[#E8EAED]">
              {currentAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[28px] font-black text-white"
                  style={{ background: '#1B6FF0' }}
                >
                  {initials}
                </div>
              )}
            </div>
            <div className="absolute right-0 bottom-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#1B6FF0]">
              {avatarUploading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2v8M2 6h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
          </label>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#9099A8]">프로필 사진 변경</span>
            {currentAvatarUrl && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={avatarUploading}
                className="text-[12px] font-medium text-[#F04438] disabled:opacity-40"
              >
                삭제
              </button>
            )}
          </div>
        </div>

        {/* 이름 */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-[#E8EAED] bg-white">
          <div className="px-4 pt-4 pb-3">
            <label className="mb-1.5 block text-[12px] font-semibold text-[#9099A8]">이름</label>
            <input
              value={nameValue}
              onChange={(e) => {
                setNameValue(e.target.value)
                setNameError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="w-full bg-transparent text-[15px] text-[#0F1117] outline-none"
              placeholder="이름을 입력하세요"
              maxLength={20}
            />
            {nameError && <p className="mt-1 text-[12px] text-red-500">{nameError}</p>}
          </div>
        </div>

        {/* 연동 계정 */}
        <p className="mb-2 pl-1 text-[12px] font-semibold text-[#9099A8]">연동 계정</p>
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#E8EAED] bg-white">
          {(['kakao', 'google'] as const).map((p, idx) => {
            const isConnected = linkedProviders.includes(p)
            const isCurrent = currentProvider === p
            return (
              <div
                key={p}
                className={`flex items-center gap-3 px-4 py-3.5 ${idx === 0 ? 'border-b border-[#F5F6F8]' : ''}`}
              >
                <ProviderIcon provider={p} />
                <span className="flex-1 text-[14px] text-[#0F1117]">
                  {p === 'kakao' ? '카카오' : 'Google'}
                </span>
                {isConnected && (
                  <span className="rounded-full bg-[#EBF2FF] px-2.5 py-1 text-[12px] font-semibold text-[#1B6FF0]">
                    {isCurrent ? '기본' : '연결됨'}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={handleSaveName}
          disabled={isPending}
          className="w-full rounded-2xl bg-[#1B6FF0] py-3.5 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {isPending ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'kakao')
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FEE500]">
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9 1.8C5.27 1.8 2.25 4.185 2.25 7.11c0 1.878 1.117 3.532 2.813 4.514l-.717 2.655a.225.225 0 0 0 .334.247l3.214-2.14c.365.045.74.07 1.121.07 3.728 0 6.75-2.385 6.75-5.31S12.728 1.8 9 1.8z"
            fill="#3C1E1E"
          />
        </svg>
      </div>
    )
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#E8EAED] bg-white">
      <svg width="16" height="16" viewBox="0 0 18 18">
        <path
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
          fill="#4285F4"
        />
        <path
          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
          fill="#34A853"
        />
        <path
          d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
          fill="#FBBC05"
        />
        <path
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
          fill="#EA4335"
        />
      </svg>
    </div>
  )
}

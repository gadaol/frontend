'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateName, logout, deleteAccount } from '@/app/actions/mypage'

const PROVIDER_LABEL: Record<string, string> = {
  kakao: '카카오',
  google: 'Google',
  email: '이메일',
}

interface Props {
  displayName: string
  email: string
  phone: string
  initials: string
  linkedProviders: string[]
  currentProvider: string
}

export default function MypageClient({
  displayName,
  email,
  phone,
  initials,
  linkedProviders,
  currentProvider,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 이름 편집
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(displayName)
  const [nameError, setNameError] = useState('')

  // 로그아웃/탈퇴 확인
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleSaveName() {
    if (!nameValue.trim()) {
      setNameError('이름을 입력해주세요')
      return
    }
    startTransition(async () => {
      const result = await updateName(nameValue)
      if (result?.error) {
        setNameError('저장에 실패했어요')
      } else {
        setEditingName(false)
        setNameError('')
        router.refresh()
      }
    })
  }

  async function handleLinkProvider(provider: string) {
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/ko/auth/callback`

    if (provider === 'kakao') {
      await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo },
      })
    } else if (provider === 'google') {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
    }
  }

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteAccount()
    })
  }

  return (
    <div className="min-h-dvh bg-[#F5F6F8] pb-8">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex h-14 items-center border-b border-[#E8EAED] bg-white px-5">
        <h1 className="text-[17px] font-bold text-[#0F1117]">마이페이지</h1>
      </div>

      <div className="space-y-3 px-4 pt-5">
        {/* 프로필 카드 */}
        <div className="rounded-2xl bg-white px-5 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1B6FF0] to-[#0D3E8A] text-[24px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="space-y-1.5">
                  <input
                    autoFocus
                    value={nameValue}
                    onChange={(e) => {
                      setNameValue(e.target.value)
                      setNameError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="w-full rounded-xl border border-[#1B6FF0] px-3 py-2 text-[15px] font-semibold text-[#0F1117] outline-none"
                    placeholder="이름을 입력하세요"
                    maxLength={20}
                  />
                  {nameError && <p className="text-[12px] text-red-500">{nameError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingName(false)
                        setNameValue(displayName)
                        setNameError('')
                      }}
                      className="flex-1 rounded-xl border border-[#E8EAED] py-2 text-[13px] font-medium text-[#9099A8]"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveName}
                      disabled={isPending}
                      className="flex-1 rounded-xl bg-[#1B6FF0] py-2 text-[13px] font-semibold text-white disabled:opacity-60"
                    >
                      {isPending ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[17px] font-semibold text-[#0F1117]">
                      {displayName}
                    </span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="flex-shrink-0 rounded-full bg-[#F5F6F8] px-2.5 py-1 text-[12px] font-medium text-[#5A6270]"
                    >
                      편집
                    </button>
                  </div>
                  <div className="mt-0.5 truncate text-[13px] text-[#9099A8]">{email}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 연동 계정 */}
        <div className="rounded-2xl bg-white">
          <div className="border-b border-[#F5F6F8] px-5 pt-4 pb-2">
            <p className="text-[12px] font-semibold tracking-wide text-[#9099A8]">연동 계정</p>
          </div>
          {(['kakao', 'google', 'email'] as const).map((p, idx, arr) => {
            const isConnected = linkedProviders.includes(p)
            const isCurrent = currentProvider === p
            const isLast = idx === arr.length - 1
            return (
              <div
                key={p}
                className={`flex items-center gap-3 px-5 py-4 ${!isLast ? 'border-b border-[#F5F6F8]' : ''}`}
              >
                <ProviderIcon provider={p} />
                <span className="flex-1 text-[15px] text-[#0F1117]">{PROVIDER_LABEL[p]}</span>
                {isConnected ? (
                  <span className="rounded-full bg-[#EBF2FF] px-2.5 py-1 text-[12px] font-semibold text-[#1B6FF0]">
                    {isCurrent ? '기본' : '연결됨'}
                  </span>
                ) : p === 'email' ? (
                  <span className="text-[13px] text-[#C5CAD3]">—</span>
                ) : (
                  <button
                    onClick={() => handleLinkProvider(p)}
                    className="rounded-full border border-[#1B6FF0] px-3 py-1 text-[13px] font-semibold text-[#1B6FF0]"
                  >
                    연동하기
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* 전화번호 */}
        <div className="rounded-2xl bg-white px-5 py-4">
          <p className="mb-3 text-[12px] font-semibold tracking-wide text-[#9099A8]">전화번호</p>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-[15px] text-[#0F1117]">
              {phone || <span className="text-[#C5CAD3]">등록된 번호 없음</span>}
            </span>
            <button className="rounded-full border border-[#E8EAED] px-3 py-1 text-[13px] font-medium text-[#5A6270]">
              {phone ? '변경' : '인증하기'}
            </button>
          </div>
        </div>

        {/* 앱 정보 */}
        <div className="rounded-2xl bg-white">
          <div className="border-b border-[#F5F6F8] px-5 pt-4 pb-2">
            <p className="text-[12px] font-semibold tracking-wide text-[#9099A8]">앱 정보</p>
          </div>
          <SettingRow label="이용약관" chevron />
          <SettingRow label="개인정보처리방침" chevron />
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-[15px] text-[#0F1117]">버전</span>
            <span className="text-[13px] text-[#9099A8]">1.0.0</span>
          </div>
        </div>

        {/* 계정 */}
        <div className="rounded-2xl bg-white">
          <div className="border-b border-[#F5F6F8] px-5 pt-4 pb-2">
            <p className="text-[12px] font-semibold tracking-wide text-[#9099A8]">계정</p>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center border-b border-[#F5F6F8] px-5 py-4 text-left"
          >
            <span className="text-[15px] font-medium text-[#0F1117]">로그아웃</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex w-full items-center px-5 py-4 text-left"
          >
            <span className="text-[15px] text-[#E53935]">회원탈퇴</span>
          </button>
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <ConfirmSheet
          title="로그아웃"
          message="정말 로그아웃 하시겠어요?"
          confirmLabel="로그아웃"
          confirmColor="#E53935"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          loading={isPending}
        />
      )}

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <ConfirmSheet
          title="회원탈퇴"
          message="정말 탈퇴하시겠어요? 모든 데이터가 삭제되며 복구할 수 없어요."
          confirmLabel="탈퇴하기"
          confirmColor="#E53935"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          loading={isPending}
        />
      )}
    </div>
  )
}

function SettingRow({ label, chevron }: { label: string; chevron?: boolean }) {
  return (
    <button className="flex w-full items-center justify-between border-b border-[#F5F6F8] px-5 py-4 last:border-0">
      <span className="text-[15px] text-[#0F1117]">{label}</span>
      {chevron && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 4l4 4-4 4"
            stroke="#C5CAD3"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}

function ConfirmSheet({
  title,
  message,
  confirmLabel,
  confirmColor,
  onCancel,
  onConfirm,
  loading,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmColor: string
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
      <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-6">
        <p className="mb-1.5 text-center text-[17px] font-bold text-[#0F1117]">{title}</p>
        <p className="mb-6 text-center text-[14px] leading-relaxed text-[#9099A8]">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[#E8EAED] py-3.5 text-[15px] font-semibold text-[#5A6270]"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-2xl py-3.5 text-[15px] font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: confirmColor }}
          >
            {loading ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'kakao') {
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#FEE500]">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9 1.8C5.27 1.8 2.25 4.185 2.25 7.11c0 1.878 1.117 3.532 2.813 4.514l-.717 2.655a.225.225 0 0 0 .334.247l3.214-2.14c.365.045.74.07 1.121.07 3.728 0 6.75-2.385 6.75-5.31S12.728 1.8 9 1.8z"
            fill="#3C1E1E"
          />
        </svg>
      </div>
    )
  }
  if (provider === 'google') {
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#E8EAED] bg-white">
        <svg width="18" height="18" viewBox="0 0 18 18">
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
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F5F6F8]">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 2.25a2.813 2.813 0 1 1 0 5.625A2.813 2.813 0 0 1 9 2.25zM3.375 14.063c0-2.486 2.52-4.5 5.625-4.5s5.625 2.014 5.625 4.5"
          stroke="#9099A8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

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

export type Plan = 'free' | 'pro' | 'team'

const PLAN_LABEL: Record<Plan, string> = { free: '무료', pro: 'Pro', team: 'Team' }
const PLAN_COLOR: Record<Plan, string> = {
  free: '#9099A8',
  pro: '#1B6FF0',
  team: '#7C3AED',
}
const PLAN_BG: Record<Plan, string> = {
  free: '#F5F6F8',
  pro: '#EBF2FF',
  team: '#F3EFFF',
}

interface Subscription {
  plan: Plan
  status: string
  expires_at: string | null
}

interface Props {
  displayName: string
  email: string
  phone: string
  initials: string
  linkedProviders: string[]
  currentProvider: string
  subscription: Subscription | null
}

export default function MypageClient({
  displayName,
  email,
  phone,
  initials,
  linkedProviders,
  currentProvider,
  subscription,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(displayName)
  const [nameError, setNameError] = useState('')

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPlanSheet, setShowPlanSheet] = useState(false)

  // 알림 설정 (로컬 토글 — 추후 user_preferences 연동)
  const [notifTrip, setNotifTrip] = useState(true)
  const [notifVote, setNotifVote] = useState(true)
  const [notifMate, setNotifMate] = useState(true)

  const plan: Plan =
    subscription?.plan === 'pro' || subscription?.plan === 'team' ? subscription.plan : 'free'

  const expiresLabel = subscription?.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

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
        setEditingName(false)
        setNameError('')
        router.refresh()
      }
    })
  }

  async function handleLinkProvider(provider: string) {
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/ko/auth/callback`
    if (provider === 'kakao')
      await supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo } })
    else if (provider === 'google')
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  }

  return (
    <div className="min-h-dvh bg-[#F5F6F8] pb-10">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex h-14 items-center border-b border-[#E8EAED] bg-white px-5">
        <h1 className="text-[17px] font-bold text-[#0F1117]">마이페이지</h1>
      </div>

      {/* 프로필 히어로 */}
      <div className="bg-white px-5 pt-6 pb-5">
        <div className="flex items-center gap-4">
          {/* 아바타 */}
          <div className="relative flex-shrink-0">
            <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-[#1B6FF0] to-[#0D3E8A] text-[26px] font-bold text-white">
              {initials}
            </div>
            <span
              className="absolute -right-1 -bottom-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: PLAN_BG[plan], color: PLAN_COLOR[plan] }}
            >
              {PLAN_LABEL[plan]}
            </span>
          </div>

          {/* 이름 / 이메일 */}
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="space-y-2">
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
                    className="flex-1 rounded-xl border border-[#E8EAED] py-2 text-[13px] text-[#9099A8]"
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
                  <span className="truncate text-[18px] font-bold text-[#0F1117]">
                    {displayName}
                  </span>
                  <button
                    onClick={() => setEditingName(true)}
                    className="flex-shrink-0 rounded-full bg-[#F5F6F8] px-2.5 py-1 text-[12px] text-[#5A6270]"
                  >
                    편집
                  </button>
                </div>
                <p className="mt-0.5 truncate text-[13px] text-[#9099A8]">{email}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 pt-4">
        {/* ── 구독 관리 ── */}
        <Section label="구독 관리">
          <div className="px-5 pt-4 pb-5">
            {/* 현재 플랜 배지 */}
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-black"
                style={{ backgroundColor: PLAN_BG[plan], color: PLAN_COLOR[plan] }}
              >
                {plan === 'free' ? 'F' : plan === 'pro' ? 'P' : 'T'}
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#0F1117]">
                  {plan === 'free' ? '무료 플랜' : plan === 'pro' ? 'Pro 플랜' : 'Team 플랜'}
                </p>
                <p className="text-[12px] text-[#9099A8]">
                  {plan === 'free'
                    ? '여행 3개 · 멤버 3명 제한'
                    : expiresLabel
                      ? `${expiresLabel}까지 이용`
                      : '무제한 이용 중'}
                </p>
              </div>
            </div>

            {/* 플랜 혜택 */}
            <div className="mb-4 space-y-1.5">
              {PLAN_BENEFITS[plan].map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <span className="text-[13px]" style={{ color: PLAN_COLOR[plan] }}>
                    ✓
                  </span>
                  <span className="text-[13px] text-[#5A6270]">{b}</span>
                </div>
              ))}
              {plan === 'free' &&
                LOCKED_BENEFITS.map((b) => (
                  <div key={b} className="flex items-center gap-2 opacity-40">
                    <span className="text-[13px] text-[#9099A8]">✕</span>
                    <span className="text-[13px] text-[#9099A8]">{b}</span>
                  </div>
                ))}
            </div>

            {/* CTA */}
            {plan === 'free' ? (
              <button
                onClick={() => setShowPlanSheet(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#1B6FF0] py-3.5 text-[15px] font-bold text-white"
              >
                <span>🚀</span>
                <span>Pro로 업그레이드</span>
              </button>
            ) : (
              <button
                onClick={() => setShowPlanSheet(true)}
                className="flex w-full items-center justify-center rounded-2xl border border-[#E8EAED] py-3 text-[14px] font-medium text-[#5A6270]"
              >
                구독 상세 보기
              </button>
            )}
          </div>
        </Section>

        {/* ── 연동 계정 ── */}
        <Section label="연동 계정">
          {(['kakao', 'google', 'email'] as const).map((p, idx, arr) => {
            const isConnected = linkedProviders.includes(p)
            const isCurrent = currentProvider === p
            return (
              <Row key={p} last={idx === arr.length - 1}>
                <ProviderIcon provider={p} />
                <span className="flex-1 text-[15px] text-[#0F1117]">{PROVIDER_LABEL[p]}</span>
                {isConnected ? (
                  <span
                    className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
                    style={{
                      backgroundColor: isCurrent ? PLAN_BG['pro'] : '#F0FFF4',
                      color: isCurrent ? '#1B6FF0' : '#15803D',
                    }}
                  >
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
              </Row>
            )
          })}
        </Section>

        {/* ── 전화번호 ── */}
        <Section label="전화번호">
          <Row last>
            <span className="flex-1 text-[15px] text-[#0F1117]">
              {phone || <span className="text-[#C5CAD3]">등록된 번호 없음</span>}
            </span>
            <button className="rounded-full border border-[#E8EAED] px-3 py-1 text-[13px] text-[#5A6270]">
              {phone ? '변경' : '인증하기'}
            </button>
          </Row>
        </Section>

        {/* ── 알림 설정 ── */}
        <Section label="알림 설정">
          <ToggleRow label="여행 일정 알림" value={notifTrip} onChange={setNotifTrip} />
          <ToggleRow label="투표 참여 알림" value={notifVote} onChange={setNotifVote} />
          <ToggleRow label="메이트 초대 알림" value={notifMate} onChange={setNotifMate} last />
        </Section>

        {/* ── 앱 정보 ── */}
        <Section label="앱 정보">
          <LinkRow label="이용약관" />
          <LinkRow label="개인정보처리방침" />
          <Row last>
            <span className="text-[15px] text-[#0F1117]">버전</span>
            <span className="ml-auto text-[13px] text-[#9099A8]">1.0.0</span>
          </Row>
        </Section>

        {/* ── 계정 ── */}
        <Section label="계정">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center border-b border-[#F5F6F8] px-5 py-4"
          >
            <span className="text-[15px] text-[#0F1117]">로그아웃</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex w-full items-center px-5 py-4"
          >
            <span className="text-[15px] text-red-500">회원탈퇴</span>
          </button>
        </Section>
      </div>

      {/* 플랜 업그레이드 시트 */}
      {showPlanSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50"
          onClick={() => setShowPlanSheet(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white px-5 pt-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[#E8EAED]" />
            <h2 className="mt-4 mb-6 text-center text-[20px] font-black text-[#0F1117]">
              플랜 선택
            </h2>

            <div className="space-y-3">
              {PLANS.map((p) => (
                <div
                  key={p.key}
                  className="rounded-2xl border-2 p-4"
                  style={{ borderColor: p.key === plan ? PLAN_COLOR[p.key] : '#E8EAED' }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[12px] font-bold"
                        style={{ backgroundColor: PLAN_BG[p.key], color: PLAN_COLOR[p.key] }}
                      >
                        {PLAN_LABEL[p.key]}
                      </span>
                      {p.key === plan && (
                        <span className="text-[12px] text-[#9099A8]">현재 플랜</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[17px] font-black text-[#0F1117]">{p.price}</span>
                      {p.period && (
                        <span className="ml-1 text-[12px] text-[#9099A8]">{p.period}</span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-[13px] text-[#5A6270]">
                        <span style={{ color: PLAN_COLOR[p.key] }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {p.key !== plan && (
                    <button
                      className="mt-3 w-full rounded-xl py-3 text-[14px] font-bold text-white"
                      style={{ backgroundColor: PLAN_COLOR[p.key] }}
                    >
                      {p.key === 'free' ? '다운그레이드' : `${PLAN_LABEL[p.key]}로 업그레이드`}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <ConfirmSheet
          title="로그아웃"
          message="정말 로그아웃 하시겠어요?"
          confirmLabel="로그아웃"
          confirmColor="#E53935"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={() =>
            startTransition(async () => {
              await logout()
            })
          }
          loading={isPending}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmSheet
          title="회원탈퇴"
          message="정말 탈퇴하시겠어요? 모든 데이터가 삭제되며 복구할 수 없어요."
          confirmLabel="탈퇴하기"
          confirmColor="#E53935"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() =>
            startTransition(async () => {
              await deleteAccount()
            })
          }
          loading={isPending}
        />
      )}
    </div>
  )
}

// ── 플랜 데이터 ──────────────────────────────────────────

const PLAN_BENEFITS: Record<Plan, string[]> = {
  free: ['여행 최대 3개', '여행당 멤버 최대 3명', '장소 검색 · 백로그 저장', '일정 관리 기본 기능'],
  pro: [
    '여행 무제한',
    '여행당 멤버 최대 10명',
    '후보 장소 투표',
    'AI 장소 추천 (출시 예정)',
    '백로그 무제한',
  ],
  team: ['여행 무제한', '멤버 무제한', '실시간 협업 편집', 'AI 장소 추천', '팀 통계 · 우선 지원'],
}
const LOCKED_BENEFITS = ['여행 무제한', '멤버 최대 10명', 'AI 장소 추천']

const PLANS: { key: Plan; price: string; period?: string; features: string[] }[] = [
  { key: 'free', price: '무료', features: PLAN_BENEFITS.free },
  { key: 'pro', price: '₩4,900', period: '/ 월', features: PLAN_BENEFITS.pro },
  { key: 'team', price: '₩9,900', period: '/ 월', features: PLAN_BENEFITS.team },
]

// ── 하위 컴포넌트 ────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      <div className="border-b border-[#F5F6F8] px-5 pt-4 pb-2.5">
        <p className="text-[11px] font-bold tracking-widest text-[#9099A8] uppercase">{label}</p>
      </div>
      {children}
    </div>
  )
}

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-3.5 ${!last ? 'border-b border-[#F5F6F8]' : ''}`}
    >
      {children}
    </div>
  )
}

function LinkRow({ label }: { label: string }) {
  return (
    <button className="flex w-full items-center justify-between border-b border-[#F5F6F8] px-5 py-3.5">
      <span className="text-[15px] text-[#0F1117]">{label}</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M6 4l4 4-4 4"
          stroke="#C5CAD3"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function ToggleRow({
  label,
  value,
  onChange,
  last,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  last?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-3.5 ${!last ? 'border-b border-[#F5F6F8]' : ''}`}
    >
      <span className="text-[15px] text-[#0F1117]">{label}</span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${value ? 'bg-[#1B6FF0]' : 'bg-[#D0D3D9]'}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8">
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
  if (provider === 'kakao')
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
  if (provider === 'google')
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

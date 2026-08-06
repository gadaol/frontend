'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { updateName, logout, deleteAccount, uploadAvatar } from '@/app/actions/mypage'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import AppHeader from '@/components/common/AppHeader'
import { BellIcon } from '@/components/icons'

export type Plan = 'free' | 'pro' | 'team'

const PLAN_LABEL: Record<Plan, string> = { free: 'Free', pro: 'Pro', team: 'Team' }

interface Subscription {
  plan: Plan
  status: string
  expires_at: string | null
}

interface Props {
  displayName: string
  email: string
  initials: string
  avatarUrl: string | null
  linkedProviders: string[]
  currentProvider: string
  subscription: Subscription | null
  tripCount: number
  placeCount: number
}

export default function MypageClient({
  displayName,
  email,
  initials,
  avatarUrl,
  linkedProviders,
  currentProvider,
  subscription,
  tripCount,
  placeCount,
}: Props) {
  const router = useRouter()
  const locale = useLocale()
  const unreadCount = useUnreadCount()
  const [isPending, startTransition] = useTransition()

  const [nameValue, setNameValue] = useState(displayName)
  const [nameError, setNameError] = useState('')
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPlanSheet, setShowPlanSheet] = useState(false)
  const [showProfileSheet, setShowProfileSheet] = useState(false)

  const plan: Plan =
    subscription?.plan === 'pro' || subscription?.plan === 'team' ? subscription.plan : 'free'

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
        setShowProfileSheet(false)
        setNameError('')
        router.refresh()
      }
    })
  }

  async function handleLinkProvider(provider: 'kakao' | 'google') {
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/${locale}/auth/callback?redirect_to=/${locale}/mypage`
    await supabase.auth.linkIdentity({ provider, options: { redirectTo } })
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

  return (
    <div className="bg-bg2 min-h-dvh pb-10">
      <AppHeader
        title="마이페이지"
        border
        right={
          <Link href={`/${locale}/notifications`} className="relative flex h-10 w-10 items-center justify-center">
            <BellIcon size={22} className="text-ink2" />
            {unreadCount > 0 && (
              <span className="bg-error absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        }
      />

      {/* 프로필 카드 */}
      <div className="border-border mx-4 mt-3.5 overflow-hidden rounded-[20px] border bg-white">
        {/* 배너 */}
        <div
          className="relative h-[72px]"
          style={{ background: 'linear-gradient(135deg,#070E1A 0%,#1B6FF0 60%,#0F2351 100%)' }}
        >
          {/* 아바타 — 배너 아래로 오버랩 */}
          <div className="absolute -bottom-7 left-5">
            <div className="h-14 w-14 overflow-hidden rounded-full border-[3px] border-white">
              {currentAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[22px] font-black text-white"
                  style={{ background: '#1B6FF0' }}
                >
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* 프로필 편집 버튼 */}
          <button
            onClick={() => setShowProfileSheet(true)}
            className="absolute right-4 bottom-3 flex items-center gap-1.5 rounded-[20px] border border-white/25 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M8 2l2 2-6 6H2V8L8 2z"
                stroke="white"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
            프로필 편집
          </button>
        </div>

        {/* 이름/이메일 */}
        <div className="px-5 pt-9 pb-4">
          <p className="text-[18px] font-bold tracking-[-0.3px] text-[#0F1117]">{displayName}</p>
          <p className="mt-0.5 text-[13px] text-[#9099A8]">{email}</p>
        </div>

        {/* 스탯 */}
        <div className="border-border grid grid-cols-3 border-t">
          {[
            { num: tripCount, label: '참여 여행' },
            { num: placeCount, label: '저장 장소' },
            { num: PLAN_LABEL[plan], label: '현재 플랜' },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center py-3.5 ${i < 2 ? 'border-border border-r' : ''}`}
            >
              <span className="text-[20px] font-black tracking-[-0.5px] text-[#0F1117]">
                {s.num}
              </span>
              <span className="mt-0.5 text-[11px] text-[#9099A8]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pro 업그레이드 배너 (free 플랜일 때만) */}
      {plan === 'free' && (
        <button
          onClick={() => setShowPlanSheet(true)}
          className="mx-4 mt-3 flex w-[calc(100%-32px)] items-center gap-3.5 rounded-2xl p-4"
          style={{ background: 'linear-gradient(135deg,#070E1A,#1B6FF0)' }}
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2l2 6h6l-5 4 2 6-5-3.5L6 18l2-6-5-4h6z" fill="#FEE500" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-[14px] font-bold text-white">Pro로 업그레이드</p>
            <p className="text-[12px] text-white/60">무제한 여행 · AI 일정 추천 · 광고 없음</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M7 4l5 5-5 5"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* 계정 그룹 */}
      <MenuGroup label="계정">
        <MenuItem
          iconBg="#EBF2FF"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="6" r="3.5" stroke="#1B6FF0" strokeWidth="1.4" />
              <path
                d="M2 17c0-3.31 3.13-6 7-6s7 2.69 7 6"
                stroke="#1B6FF0"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          }
          label="프로필 설정"
          onPress={() => setShowProfileSheet(true)}
          right={<ChevronRight />}
        />
        <MenuItem
          iconBg="#FEF3C7"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="10" rx="2" stroke="#F79009" strokeWidth="1.4" />
              <path d="M2 7.5l7 4 7-4" stroke="#F79009" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          }
          label="알림 설정"
          onPress={() => router.push(`/${locale}/notifications/settings`)}
          right={<ChevronRight />}
        />
        <MenuItem
          iconBg="#D1FAE5"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="2" width="12" height="14" rx="2" stroke="#12B76A" strokeWidth="1.4" />
              <path
                d="M6 6h6M6 9h6M6 12h4"
                stroke="#12B76A"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          }
          label="구독 관리"
          sub={`현재 ${PLAN_LABEL[plan]} 플랜`}
          onPress={() => setShowPlanSheet(true)}
          right={
            plan === 'free' ? (
              <div className="flex items-center gap-1.5">
                <span className="rounded-[10px] bg-[#EBF2FF] px-2 py-0.5 text-[11px] font-semibold text-[#1B6FF0]">
                  업그레이드
                </span>
                <ChevronRight />
              </div>
            ) : (
              <ChevronRight />
            )
          }
          last
        />
      </MenuGroup>

      {/* 앱 그룹 */}
      <MenuGroup label="앱">
        <MenuItem
          iconBg="#F5F7FA"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="#515966" strokeWidth="1.4" />
              <path d="M9 6v4M9 12.5v.5" stroke="#515966" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          }
          label="공지사항"
          right={<ChevronRight />}
        />
        <MenuItem
          iconBg="#F5F7FA"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2l1.8 5.4H17l-4.9 3.6 1.9 5.4L9 13l-5 3.4 1.9-5.4L1 6.4h6.2z"
                stroke="#515966"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          }
          label="앱 평가하기"
          right={<ChevronRight />}
          last
        />
      </MenuGroup>

      {/* 로그아웃 */}
      <div className="mx-4 mt-3 mb-6 overflow-hidden rounded-2xl border border-[#E8EAED] bg-white">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-3 px-4 py-3.5"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FEF2F2]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M7 3H3a1 1 0 00-1 1v10a1 1 0 001 1h4"
                stroke="#F04438"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M12 12l4-3-4-3M6 9h10"
                stroke="#F04438"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="flex-1 text-left text-[14px] font-medium text-[#F04438]">로그아웃</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="#F04438" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* 회원탈퇴 */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="mx-auto mb-2 block text-[13px] text-[#C5CAD3]"
      >
        회원탈퇴
      </button>

      {/* 프로필 편집 시트 */}
      {showProfileSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50"
          onClick={() => {
            setShowProfileSheet(false)
            setNameValue(displayName)
            setNameError('')
          }}
        >
          <div
            className="w-full rounded-t-3xl bg-white px-5 pt-5 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E8EAED]" />
            <h2 className="mb-5 text-[18px] font-bold text-[#0F1117]">프로필 설정</h2>

            {/* 아바타 업로드 */}
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
              <span className="text-[12px] text-[#9099A8]">프로필 사진 변경</span>
            </div>

            {/* 이름 편집 */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[12px] font-semibold text-[#9099A8]">이름</label>
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => {
                  setNameValue(e.target.value)
                  setNameError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="w-full rounded-2xl border border-[#E8EAED] px-4 py-3 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0]"
                placeholder="이름을 입력하세요"
                maxLength={20}
              />
              {nameError && <p className="mt-1 text-[12px] text-red-500">{nameError}</p>}
            </div>

            {/* 연동 계정 */}
            <p className="mb-2 text-[12px] font-semibold text-[#9099A8]">연동 계정</p>
            <div className="mb-5 overflow-hidden rounded-2xl border border-[#E8EAED]">
              {(['kakao', 'google'] as const).map((p, idx) => {
                const isConnected = linkedProviders.includes(p)
                const isCurrent = currentProvider === p
                return (
                  <div
                    key={p}
                    className={`flex items-center gap-3 px-4 py-3 ${idx === 0 ? 'border-b border-[#F5F6F8]' : ''}`}
                  >
                    <ProviderIcon provider={p} />
                    <span className="flex-1 text-[14px] text-[#0F1117]">
                      {p === 'kakao' ? '카카오' : 'Google'}
                    </span>
                    {isConnected ? (
                      <span className="rounded-full bg-[#EBF2FF] px-2.5 py-1 text-[12px] font-semibold text-[#1B6FF0]">
                        {isCurrent ? '기본' : '연결됨'}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleLinkProvider(p)}
                        className="rounded-full border border-[#1B6FF0] px-3 py-1 text-[12px] font-semibold text-[#1B6FF0]"
                      >
                        연동하기
                      </button>
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
      )}

      {/* 구독 관리 시트 */}
      {showPlanSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50"
          onClick={() => setShowPlanSheet(false)}
        >
          <div
            className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pt-5 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E8EAED]" />
            <h2 className="mb-5 text-center text-[20px] font-black text-[#0F1117]">플랜 선택</h2>

            <div className="space-y-3">
              {PLANS.map((p) => (
                <div
                  key={p.key}
                  className="rounded-2xl border-2 p-4"
                  style={{ borderColor: p.key === plan ? '#1B6FF0' : '#E8EAED' }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[12px] font-bold"
                        style={PLAN_BADGE_STYLE[p.key]}
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
                        <span style={{ color: PLAN_BADGE_STYLE[p.key].color }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {p.key !== plan && (
                    <button
                      className="mt-3 w-full rounded-xl py-3 text-[14px] font-bold text-white"
                      style={{ backgroundColor: PLAN_BADGE_STYLE[p.key].color }}
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
          confirmColor="#F04438"
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
          confirmColor="#F04438"
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

// ── 데이터 ──────────────────────────────────────────────────

const PLAN_BADGE_STYLE: Record<Plan, { backgroundColor: string; color: string }> = {
  free: { backgroundColor: '#F5F6F8', color: '#9099A8' },
  pro: { backgroundColor: '#EBF2FF', color: '#1B6FF0' },
  team: { backgroundColor: '#F3EFFF', color: '#7C3AED' },
}

const PLAN_BENEFITS: Record<Plan, string[]> = {
  free: ['여행 최대 3개', '여행당 멤버 최대 3명', '장소 검색 · 백로그 저장'],
  pro: ['여행 무제한', '여행당 멤버 최대 10명', '후보 장소 투표', 'AI 장소 추천 (출시 예정)'],
  team: ['여행 무제한', '멤버 무제한', '실시간 협업 편집', 'AI 장소 추천'],
}

const PLANS: { key: Plan; price: string; period?: string; features: string[] }[] = [
  { key: 'free', price: '무료', features: PLAN_BENEFITS.free },
  { key: 'pro', price: '₩4,900', period: '/ 월', features: PLAN_BENEFITS.pro },
  { key: 'team', price: '₩9,900', period: '/ 월', features: PLAN_BENEFITS.team },
]

// ── 서브 컴포넌트 ────────────────────────────────────────────

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="#9099A8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MenuGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 mt-3">
      <p className="mb-2 pl-1 text-[11px] font-semibold tracking-[1px] text-[#9099A8] uppercase">
        {label}
      </p>
      <div className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white">{children}</div>
    </div>
  )
}

function MenuItem({
  iconBg,
  icon,
  label,
  sub,
  right,
  onPress,
  last,
}: {
  iconBg: string
  icon: React.ReactNode
  label: string
  sub?: string
  right?: React.ReactNode
  onPress?: () => void
  last?: boolean
}) {
  return (
    <button
      onClick={onPress}
      className={`flex w-full items-center gap-3 px-4 py-3.5 ${!last ? 'border-b border-[#E8EAED]' : ''}`}
    >
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-[14px] font-medium text-[#0F1117]">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-[#9099A8]">{sub}</p>}
      </div>
      {right}
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

'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { logout, deleteAccount } from '@/app/actions/mypage'
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
  subscription: Subscription | null
  tripCount: number
  placeCount: number
}

export default function MypageClient({
  displayName,
  email,
  initials,
  avatarUrl,
  subscription,
  tripCount,
  placeCount,
}: Props) {
  const router = useRouter()
  const locale = useLocale()
  const unreadCount = useUnreadCount()
  const [isPending, startTransition] = useTransition()

  const [currentAvatarUrl] = useState(avatarUrl)

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPlanSheet, setShowPlanSheet] = useState(false)

  const plan: Plan =
    subscription?.plan === 'pro' || subscription?.plan === 'team' ? subscription.plan : 'free'

  return (
    <div className="bg-bg2 min-h-dvh pb-10">
      <AppHeader
        title="마이페이지"
        border
        right={
          <Link
            href={`/${locale}/notifications`}
            className="relative flex h-10 w-10 items-center justify-center"
          >
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
            onClick={() => router.push(`/${locale}/mypage/profile`)}
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
          onPress={() => router.push(`/${locale}/mypage/profile`)}
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
          iconBg="#EBF2FF"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="#1B6FF0" strokeWidth="1.4" />
              <path d="M9 6v4M9 12.5v.5" stroke="#1B6FF0" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          }
          label="공지사항"
          onPress={() => router.push(`/${locale}/notices`)}
          right={<ChevronRight />}
        />
        <MenuItem
          iconBg="#EBF2FF"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 3h12a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V4a1 1 0 011-1z"
                stroke="#1B6FF0"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          }
          label="문의하기"
          onPress={() => router.push(`/${locale}/inquiries`)}
          right={<ChevronRight />}
          last
        />
        {/* 앱 평가하기 — 네이티브 연동 후 활성화
        <MenuItem
          iconBg="#F5F7FA"
          icon={...}
          label="앱 평가하기"
          right={<ChevronRight />}
          last
        />
        */}
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

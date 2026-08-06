'use client'

import Link from 'next/link'
import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { logout, deleteAccount } from '@/app/actions/mypage'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import AppHeader from '@/components/common/AppHeader'
import { BellIcon } from '@/components/icons'
import api, { isApiError } from '@/lib/axios/client'

export type Plan = 'free' | 'pro' | 'plus'

interface Subscription {
  plan: Plan
  status: string
  expires_at: string | null
}

function getPlanLabel(subscription: Subscription | null): string {
  if (!subscription || subscription.plan === 'free') return 'Free'
  if (subscription.status === 'trial') return 'Pro(체험)'
  if (subscription.plan === 'plus') return 'Plus'
  return 'Pro'
}

interface Props {
  displayName: string
  email: string
  initials: string
  avatarUrl: string | null
  phone: string | null
  subscription: Subscription | null
  tripCount: number
  placeCount: number
}

export default function MypageClient({
  displayName,
  email,
  initials,
  avatarUrl,
  phone,
  subscription,
  tripCount,
  placeCount,
}: Props) {
  const router = useRouter()
  const locale = useLocale()
  const unreadCount = useUnreadCount()
  const [isPending, startTransition] = useTransition()

  const searchParams = useSearchParams()
  const [currentAvatarUrl] = useState(avatarUrl)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPlanSheet, setShowPlanSheet] = useState(false)
  const [showPhoneSheet, setShowPhoneSheet] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState(subscription)
  const [subscribedToast, setSubscribedToast] = useState(false)

  useEffect(() => {
    if (searchParams.get('subscribed') !== '1') return
    startTransition(() => setSubscribedToast(true))
    router.replace(`/${locale}/mypage`, { scroll: false })
    const t = setTimeout(() => setSubscribedToast(false), 3500)
    return () => clearTimeout(t)
  }, [searchParams, router, locale])

  const plan: Plan =
    currentSubscription?.plan === 'pro' || currentSubscription?.plan === 'plus'
      ? currentSubscription.plan
      : 'free'
  const planLabel = getPlanLabel(currentSubscription)

  return (
    <div className="bg-bg2 min-h-dvh pb-10">
      {/* 결제 완료 토스트 */}
      {subscribedToast && (
        <div className="fixed top-5 left-1/2 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-2xl bg-[#0F1117] px-4 py-3.5 shadow-2xl">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#1B6FF0]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M4 9l4 4 6-7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-bold text-white">구독이 시작됐어요!</p>
              <p className="text-[12px] text-white/60">Pro 혜택을 마음껏 누려보세요</p>
            </div>
          </div>
        </div>
      )}
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
            { num: planLabel, label: '현재 플랜' },
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

      {/* 전화번호 미인증 배너 */}
      {!phone && plan === 'free' && (
        <button
          onClick={() => setShowPhoneSheet(true)}
          className="mx-4 mt-3 flex w-[calc(100%-32px)] items-center gap-3 rounded-2xl border border-[#E8EAED] bg-white px-4 py-3.5"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#EBF2FF]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2l1.6 4.8H15l-3.9 2.8 1.5 4.7L9 11.6l-3.6 2.7 1.5-4.7L3 6.8h4.4z"
                fill="#1B6FF0"
              />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-[13px] font-bold text-[#0F1117]">전화번호 인증하고 1개월 Pro 무료</p>
            <p className="text-[12px] text-[#9099A8]">인증 한 번으로 Pro 체험 혜택 받기</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3.5l4.5 4.5L6 12.5"
              stroke="#C5CAD3"
              strokeWidth="1.6"
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
                  {p.key !== plan && p.key !== 'free' && (
                    <button
                      onClick={() => router.push(`/${locale}/payment?plan=${p.key}`)}
                      className="mt-3 w-full rounded-xl py-3 text-[14px] font-bold text-white"
                      style={{ backgroundColor: PLAN_BADGE_STYLE[p.key as Plan].color }}
                    >
                      {`${PLAN_LABEL[p.key as Plan]}로 업그레이드`}
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
        <DeleteConfirmSheet
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() =>
            startTransition(async () => {
              await deleteAccount()
            })
          }
          loading={isPending}
        />
      )}

      {showPhoneSheet && (
        <PhoneVerifySheet
          onClose={() => setShowPhoneSheet(false)}
          onVerified={(trialGranted) => {
            setShowPhoneSheet(false)
            if (trialGranted) {
              const expiresAt = new Date()
              expiresAt.setMonth(expiresAt.getMonth() + 1)
              setCurrentSubscription({
                plan: 'pro',
                status: 'trial',
                expires_at: expiresAt.toISOString(),
              })
            }
          }}
        />
      )}
    </div>
  )
}

// ── 데이터 ──────────────────────────────────────────────────

const PLAN_BADGE_STYLE: Record<Plan, { backgroundColor: string; color: string }> = {
  free: { backgroundColor: '#F5F6F8', color: '#9099A8' },
  pro: { backgroundColor: '#EBF2FF', color: '#1B6FF0' },
  plus: { backgroundColor: '#F3EFFF', color: '#7C3AED' },
}

const PLAN_LABEL: Record<Plan, string> = { free: 'Free', pro: 'Pro', plus: 'Plus' }

const PLAN_BENEFITS: Record<Plan, string[]> = {
  free: ['여행 최대 3개', '메이트 최대 2명', 'AI 추천 3회/월', '백로그 무제한 저장'],
  pro: [
    '여행 무제한',
    '메이트 최대 10명',
    'AI 추천 월 20회',
    '백로그 폴더/태그 정리',
    '팀 권한 관리',
    '광고 없음',
  ],
  plus: [
    '여행 무제한',
    '메이트 무제한',
    'AI 추천 무제한',
    '백로그 폴더/태그 정리',
    '팀 권한 관리',
    '공유 백로그',
    '광고 없음',
  ],
}

const PLANS: { key: Plan; price: string; period?: string; features: string[] }[] = [
  { key: 'free', price: '무료', features: PLAN_BENEFITS.free },
  { key: 'pro', price: '₩3,900', period: '/ 월', features: PLAN_BENEFITS.pro },
  { key: 'plus', price: '₩6,900', period: '/ 월', features: PLAN_BENEFITS.plus },
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

function DeleteConfirmSheet({
  onCancel,
  onConfirm,
  loading,
}: {
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const [input, setInput] = useState('')
  const confirmed = input === '탈퇴'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8">
      <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-6">
        <p className="mb-1.5 text-center text-[17px] font-bold text-[#0F1117]">
          정말 탈퇴하시겠어요?
        </p>
        <p className="mb-4 text-center text-[14px] leading-relaxed text-[#9099A8]">
          탈퇴 시 모든 데이터가 삭제되며 복구할 수 없어요.
        </p>
        <div className="mb-5 overflow-hidden rounded-2xl border border-[#E8EAED] px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="'탈퇴'를 입력해주세요"
            className="w-full bg-transparent text-center text-[15px] text-[#0F1117] outline-none placeholder:text-[#C5CAD3]"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[#E8EAED] py-3.5 text-[15px] font-semibold text-[#5A6270]"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || loading}
            className="flex-1 rounded-2xl bg-[#F04438] py-3.5 text-[15px] font-bold text-white disabled:opacity-40"
          >
            {loading ? '처리 중...' : '탈퇴하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function PhoneVerifySheet({
  onClose,
  onVerified,
}: {
  onClose: () => void
  onVerified: (trialGranted: boolean) => void
}) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const rawPhone = phone.replace(/-/g, '')

  const handleSend = async () => {
    setError(null)
    setSending(true)
    try {
      await api.post('/api/find-account/send', { phone: rawPhone })
      setOtpSent(true)
    } catch {
      setError('인증번호 전송에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    setError(null)
    setVerifying(true)
    try {
      const res = await api.post('/api/social-phone-verify', { phone: rawPhone, code: otp })
      setSuccess(true)
      setTimeout(() => onVerified(res.data.trialGranted ?? false), 1500)
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        setError('이미 다른 계정에 등록된 전화번호예요.')
      } else {
        setError('인증에 실패했어요. 번호를 확인해주세요.')
      }
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-t-3xl bg-white px-6 pt-5 pb-10">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#E8EAED]" />

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EBF2FF]">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M7 14l5 5 9-9"
                  stroke="#1B6FF0"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-[17px] font-bold text-[#0F1117]">인증 완료!</p>
            <p className="text-center text-[14px] text-[#9099A8]">1개월 Pro 체험이 시작됐어요.</p>
          </div>
        ) : (
          <>
            <p className="mb-1 text-[17px] font-bold text-[#0F1117]">전화번호 인증</p>
            <p className="mb-5 text-[13px] text-[#9099A8]">
              인증 완료 시 1개월 Pro 무료체험이 시작돼요.
            </p>

            <div className="mb-3 flex gap-2">
              <div className="flex h-[50px] flex-1 items-center rounded-xl border border-[#E8EAED] px-4">
                <input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                  disabled={otpSent}
                  className="w-full bg-transparent text-[15px] text-[#0F1117] outline-none placeholder:text-[#C5CAD3] disabled:text-[#9099A8]"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={rawPhone.length < 10 || sending}
                className="h-[50px] rounded-xl bg-[#1B6FF0] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                {sending ? '전송 중' : otpSent ? '재전송' : '인증번호'}
              </button>
            </div>

            {otpSent && (
              <div className="mb-4 flex h-[50px] items-center rounded-xl border border-[#1B6FF0] px-4">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="인증번호 6자리"
                  inputMode="numeric"
                  className="w-full bg-transparent text-[15px] tracking-widest text-[#0F1117] outline-none placeholder:tracking-normal placeholder:text-[#C5CAD3]"
                />
              </div>
            )}

            {error && <p className="mb-3 text-[13px] text-[#F04438]">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-[#E8EAED] py-3.5 text-[15px] font-medium text-[#5A6270]"
              >
                취소
              </button>
              {otpSent && (
                <button
                  onClick={handleVerify}
                  disabled={otp.length < 6 || verifying}
                  className="flex-1 rounded-2xl bg-[#1B6FF0] py-3.5 text-[15px] font-bold text-white disabled:opacity-40"
                >
                  {verifying ? '확인 중...' : '인증 완료'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
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

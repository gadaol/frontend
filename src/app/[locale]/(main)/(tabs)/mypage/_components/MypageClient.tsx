'use client'

import Link from 'next/link'
import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { logout, deleteAccount } from '@/app/actions/mypage'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import AppHeader from '@/components/common/AppHeader'
import Button from '@/components/ui/Button'
import { BellIcon } from '@/components/icons'
import api, { isApiError } from '@/lib/axios/client'
import { PLAN_LABEL, type Plan } from '@/utils/plans'
import { useAssistantStore } from '@/lib/ai/store'
import CharacterFigure from '@/components/features/ai/CharacterFigure'
import { CHARACTER_META, type CharacterId } from '@/lib/ai/characters'

/** 라벨은 현재 보고 있는 UI 언어로 통일한다 (한국어/영어 ↔ Korean/English) */
const LOCALES = [
  { code: 'ko', label: { ko: '한국어', en: 'Korean' } },
  { code: 'en', label: { ko: '영어', en: 'English' } },
] as const

interface Subscription {
  plan: Plan
  status: string
  expires_at: string | null
}

function getPlanLabel(subscription: Subscription | null, t: (k: string) => string): string {
  if (!subscription || subscription.plan === 'free') return 'Free'
  if (subscription.status === 'trial') return t('planProTrial')
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
  const t = useTranslations('mypage')
  const router = useRouter()
  const locale = useLocale()
  const pathname = usePathname()

  /** 현재 화면을 유지한 채 경로의 로케일 구간만 교체한다 */
  function switchLocale(next: string) {
    if (next === locale) return
    router.replace(pathname.replace(/^\/[^/]+/, `/${next}`))
    router.refresh()
  }

  const unreadCount = useUnreadCount()
  const [isPending, startTransition] = useTransition()
  const { character, setCharacter } = useAssistantStore()

  const searchParams = useSearchParams()
  const [currentAvatarUrl] = useState(avatarUrl)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPhoneSheet, setShowPhoneSheet] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState(subscription)
  const [subscribedToast, setSubscribedToast] = useState(false)

  // 마운트 시 1회만 체크 — router.replace로 searchParams 바뀌어도 재실행 안 됨
  useEffect(() => {
    if (searchParams.get('subscribed') !== '1') return
    startTransition(() => setSubscribedToast(true))
    router.replace(`/${locale}/mypage`, { scroll: false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!subscribedToast) return
    const t = setTimeout(() => setSubscribedToast(false), 3500)
    return () => clearTimeout(t)
  }, [subscribedToast])

  const plan: Plan =
    currentSubscription?.plan === 'pro' || currentSubscription?.plan === 'plus'
      ? currentSubscription.plan
      : 'free'
  const planLabel = getPlanLabel(currentSubscription, t)

  return (
    <div className="bg-bg2 min-h-dvh pb-10">
      {/* 결제 완료 토스트 */}
      {subscribedToast && (
        <div className="animate-in fade-in slide-in-from-top-3 fixed top-4 right-4 left-4 z-[100] duration-300">
          <div
            className="flex items-center gap-4 rounded-2xl px-5 py-4 shadow-2xl"
            style={{ background: 'linear-gradient(135deg,var(--color-hero-top),#1B3A7A)' }}
          >
            <div className="bg-primary flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M5 11l5 5 7-9"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-bold text-white">{t('subscribed.title')}</p>
              <p className="mt-0.5 text-[13px] text-white/60">{t('subscribed.desc')}</p>
            </div>
          </div>
        </div>
      )}
      <AppHeader
        title={t('title')}
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
        <div className="relative h-[72px]" style={{ backgroundColor: 'var(--color-primary)' }}>
          {/* 우상단 로고 마크 */}
          <svg
            aria-hidden
            viewBox="0 0 48 48"
            style={{
              position: 'absolute',
              right: -12,
              top: -12,
              width: 90,
              height: 90,
              opacity: 0.18,
            }}
          >
            <g transform="translate(10 9)">
              <path d="M3 24L23 4L18 24L12 17Z" fill="white" />
              <path d="M17 25L20 30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </svg>

          {/* 아바타 — 배너 아래로 오버랩 */}
          <div className="absolute -bottom-7 left-5 z-10">
            <div className="h-14 w-14 overflow-hidden rounded-full border-[3px] border-white">
              {currentAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[22px] font-black text-white"
                  style={{ backgroundColor: 'var(--color-primary-hover)' }}
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
            {t('editProfile')}
          </button>
        </div>

        {/* 이름/이메일 */}
        <div className="px-5 pt-9 pb-4">
          <p className="text-ink text-[18px] font-bold tracking-[-0.3px]">{displayName}</p>
          <p className="text-ink3 mt-0.5 text-[13px]">{email}</p>
        </div>

        {/* 스탯 */}
        <div className="border-border grid grid-cols-3 border-t">
          {[
            { num: tripCount, label: t('statsTrips') },
            { num: placeCount, label: t('statsPlaces') },
            { num: planLabel, label: t('subscription.currentPlan') },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center py-3.5 ${i < 2 ? 'border-border border-r' : ''}`}
            >
              <span className="text-ink text-[20px] font-black tracking-[-0.5px]">{s.num}</span>
              <span className="text-ink3 mt-0.5 text-[11px]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 업그레이드 배너 (plus가 아닐 때) */}
      {plan !== 'plus' && (
        <button
          onClick={() => router.push(`/${locale}/mypage/subscription`)}
          className="mx-4 mt-3 flex w-[calc(100%-32px)] items-center gap-3.5 overflow-hidden rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, #1b6ff0 0%, #7c3aed 100%)',
            position: 'relative',
          }}
        >
          {/* 우상단 로고 마크 */}
          <svg
            aria-hidden
            viewBox="0 0 48 48"
            style={{
              position: 'absolute',
              right: -8,
              top: -10,
              width: 72,
              height: 72,
              opacity: 0.18,
            }}
          >
            <g transform="translate(10 9)">
              <path d="M3 24L23 4L18 24L12 17Z" fill="white" />
              <path d="M17 25L20 30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </svg>
          <div className="relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2l2 6h6l-5 4 2 6-5-3.5L6 18l2-6-5-4h6z" fill="var(--color-kakao)" />
            </svg>
          </div>
          <div className="relative flex-1 text-left">
            <p className="text-[14px] font-bold text-white">
              {t('upgradeTo', { plan: plan === 'free' ? 'Pro' : 'Plus' })}
            </p>
            <p className="text-[12px] text-white/60">
              {plan === 'free' ? t('upgradeProDesc') : t('upgradePlusDesc')}
            </p>
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
          className="border-border mx-4 mt-3 flex w-[calc(100%-32px)] items-center gap-3 rounded-2xl border bg-white px-4 py-3.5"
        >
          <div className="bg-primary-light flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2l1.6 4.8H15l-3.9 2.8 1.5 4.7L9 11.6l-3.6 2.7 1.5-4.7L3 6.8h4.4z"
                fill="var(--color-primary)"
              />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-ink text-[13px] font-bold">{t('phone.promoTitle')}</p>
            <p className="text-ink3 text-[12px]">{t('phone.promoDesc')}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3.5l4.5 4.5L6 12.5"
              stroke="var(--color-ink3)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* 계정 그룹 */}
      <MenuGroup label={t('sectionAccount')}>
        <MenuItem
          iconBg="var(--color-primary-light)"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="6" r="3.5" stroke="var(--color-primary)" strokeWidth="1.4" />
              <path
                d="M2 17c0-3.31 3.13-6 7-6s7 2.69 7 6"
                stroke="var(--color-primary)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          }
          label={t('profileSettings')}
          onPress={() => router.push(`/${locale}/mypage/profile`)}
          right={<ChevronRight />}
        />
        <MenuItem
          iconBg="var(--color-primary-light)"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect
                x="2"
                y="4"
                width="14"
                height="10"
                rx="2"
                stroke="var(--color-primary)"
                strokeWidth="1.4"
              />
              <path
                d="M2 7.5l7 4 7-4"
                stroke="var(--color-primary)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          }
          label={t('notificationSettings')}
          onPress={() => router.push(`/${locale}/notifications/settings`)}
          right={<ChevronRight />}
        />
        <MenuItem
          iconBg="var(--color-primary-light)"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect
                x="3"
                y="2"
                width="12"
                height="14"
                rx="2"
                stroke="var(--color-primary)"
                strokeWidth="1.4"
              />
              <path
                d="M6 6h6M6 9h6M6 12h4"
                stroke="var(--color-primary)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          }
          label={t('subscription.title')}
          sub={t('currentPlanOf', { plan: PLAN_LABEL[plan] })}
          onPress={() => router.push(`/${locale}/mypage/subscription`)}
          right={
            plan === 'free' ? (
              <div className="flex items-center gap-1.5">
                <span className="bg-primary-light text-primary rounded-[10px] px-2 py-0.5 text-[11px] font-semibold">
                  {t('upgrade')}
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

      {/* 언어 — 선택지가 둘뿐이라 한 줄 토글로 둔다 */}
      <div className="mx-4 mt-3">
        <div className="border-border flex items-center justify-between rounded-2xl border bg-white px-4 py-3">
          <span className="text-ink text-[14px] font-medium">{t('sectionLanguage')}</span>
          <div className="bg-bg2 flex items-center gap-0.5 rounded-full p-0.5">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => switchLocale(code)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all ${
                  locale === code ? 'text-ink bg-white shadow-sm' : 'text-ink3'
                }`}
              >
                {locale === 'ko' ? label.ko : label.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI 비서 설정 */}
      <div className="mx-4 mt-3">
        <p className="text-ink3 mb-2 pl-1 text-[11px] font-semibold tracking-[1px] uppercase">
          {t('sectionAi')}
        </p>
        <div className="border-border overflow-hidden rounded-2xl border bg-white p-4">
          <p className="text-ink mb-3 text-[13px] font-medium">{t('aiPickMate')}</p>
          <div className="flex gap-3">
            {(['gada', 'rog'] as CharacterId[]).map((id) => {
              const info = CHARACTER_META[id]
              const active = character === id
              return (
                <button
                  key={id}
                  onClick={() => setCharacter(id)}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 py-4 transition-all ${
                    active ? 'border-primary bg-primary-light' : 'border-border bg-bg2'
                  }`}
                >
                  <CharacterFigure character={id} size="md" />
                  <div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mb-1 ${active ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-ink3'}`}>
                      {info.type[locale as 'ko' | 'en']}
                    </span>
                    <p className={`text-[14px] font-bold ${active ? 'text-primary' : 'text-ink'}`}>
                      {info.name[locale as 'ko' | 'en']}
                    </p>
                    <p className="text-ink3 mt-0.5 text-[11px]">
                      {info.tagline[locale as 'ko' | 'en']}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 앱 그룹 */}
      <MenuGroup label={t('sectionApp')}>
        <MenuItem
          iconBg="var(--color-primary-light)"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="var(--color-primary)" strokeWidth="1.4" />
              <path
                d="M9 6v4M9 12.5v.5"
                stroke="var(--color-primary)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          }
          label={t('notices')}
          onPress={() => router.push(`/${locale}/notices`)}
          right={<ChevronRight />}
        />
        <MenuItem
          iconBg="var(--color-primary-light)"
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 3h12a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V4a1 1 0 011-1z"
                stroke="var(--color-primary)"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          }
          label={t('inquiries')}
          onPress={() => router.push(`/${locale}/inquiries`)}
          right={<ChevronRight />}
          last
        />
        {/* 앱 평가하기 — 네이티브 연동 후 활성화
        <MenuItem
          iconBg="var(--color-bg2)"
          icon={...}
          label="앱 평가하기"
          right={<ChevronRight />}
          last
        />
        */}
      </MenuGroup>

      {/* 로그아웃 */}
      <div className="border-border mx-4 mt-3 mb-6 overflow-hidden rounded-2xl border bg-white">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-3 px-4 py-3.5"
        >
          <div className="bg-error-light flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M7 3H3a1 1 0 00-1 1v10a1 1 0 001 1h4"
                stroke="var(--color-error)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M12 12l4-3-4-3M6 9h10"
                stroke="var(--color-error)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-error flex-1 text-left text-[14px] font-medium">{t('logout')}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4l4 4-4 4"
              stroke="var(--color-error)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* 회원탈퇴 */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="text-ink3 mx-auto mb-2 block text-[13px]"
      >
        {t('deleteAccount')}
      </button>

      {showLogoutConfirm && (
        <ConfirmSheet
          title={t('logout')}
          message={t('logoutConfirm')}
          confirmLabel={t('logout')}
          confirmColor="var(--color-error)"
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

// ── 서브 컴포넌트 ────────────────────────────────────────────

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="var(--color-ink3)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MenuGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 mt-3">
      <p className="text-ink3 mb-2 pl-1 text-[11px] font-semibold tracking-[1px] uppercase">
        {label}
      </p>
      <div className="border-border overflow-hidden rounded-2xl border bg-white">{children}</div>
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
      className={`flex w-full items-center gap-3 px-4 py-3.5 ${!last ? 'border-border border-b' : ''}`}
    >
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-ink text-[14px] font-medium">{label}</p>
        {sub && <p className="text-ink3 mt-0.5 text-[11px]">{sub}</p>}
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
  const t = useTranslations('mypage')
  const tc = useTranslations('common')
  const [input, setInput] = useState('')
  const confirmed = input === t('deleteWord')

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 px-4 pb-8">
      <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-6">
        <p className="text-ink mb-1.5 text-center text-[17px] font-bold">{t('deleteTitle')}</p>
        <p className="text-ink3 mb-4 text-center text-[14px] leading-relaxed">
          {t('deleteWarning')}
        </p>
        <div className="border-border mb-5 overflow-hidden rounded-2xl border px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('deleteWordPrompt')}
            className="text-ink placeholder:text-ink3 w-full bg-transparent text-center text-[15px] outline-none"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            {tc('cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={!confirmed || loading}
            className="flex-1"
          >
            {loading ? t('processing') : t('deleteSubmit')}
          </Button>
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
  const t = useTranslations('mypage')
  const tc = useTranslations('common')
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
      setError(t('phone.sendFailed'))
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
        setError(t('phone.duplicate'))
      } else {
        setError(t('phone.verifyFailed'))
      }
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-t-3xl bg-white px-6 pt-5 pb-10">
        <div className="bg-border mx-auto mb-5 h-1 w-10 rounded-full" />

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="bg-primary-light flex h-14 w-14 items-center justify-center rounded-full">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M7 14l5 5 9-9"
                  stroke="var(--color-primary)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-ink text-[17px] font-bold">{t('phone.successTitle')}</p>
            <p className="text-ink3 text-center text-[14px]">{t('phone.successDesc')}</p>
          </div>
        ) : (
          <>
            <p className="text-ink mb-1 text-[17px] font-bold">{t('phone.verifyTitle')}</p>
            <p className="text-ink3 mb-5 text-[13px]">{t('phone.verifyDesc')}</p>

            <div className="mb-3 flex gap-2">
              <div className="border-border flex h-[50px] flex-1 items-center rounded-xl border px-4">
                <input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                  disabled={otpSent}
                  className="text-ink placeholder:text-ink3 disabled:text-ink3 w-full bg-transparent text-[15px] outline-none"
                />
              </div>
              <Button onClick={handleSend} disabled={rawPhone.length < 10 || sending}>
                {sending ? t('phone.sending') : otpSent ? t('phone.resend') : t('phone.code')}
              </Button>
            </div>

            {otpSent && (
              <div className="border-primary mb-4 flex h-[50px] items-center rounded-xl border px-4">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('phone.codePlaceholder')}
                  inputMode="numeric"
                  className="text-ink placeholder:text-ink3 w-full bg-transparent text-[15px] tracking-widest outline-none placeholder:tracking-normal"
                />
              </div>
            )}

            {error && <p className="text-error mb-3 text-[13px]">{error}</p>}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                {tc('cancel')}
              </Button>
              {otpSent && (
                <Button
                  onClick={handleVerify}
                  disabled={otp.length < 6 || verifying}
                  className="flex-1"
                >
                  {verifying ? t('phone.verifying') : t('phone.verified')}
                </Button>
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
  const t = useTranslations('mypage')
  const tc = useTranslations('common')
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 px-4 pb-8">
      <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-6">
        <p className="text-ink mb-1.5 text-center text-[17px] font-bold">{title}</p>
        <p className="text-ink3 mb-6 text-center text-[14px] leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="border-border text-ink h-[52px] flex-1 rounded-xl border bg-white text-[15px] font-medium"
          >
            {tc('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-[52px] flex-1 rounded-xl text-[15px] font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: confirmColor }}
          >
            {loading ? t('processing') : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

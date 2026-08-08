'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updateName, uploadAvatar, deleteAvatar, updateTravelStyle } from '@/app/actions/mypage'
import AppHeader from '@/components/common/AppHeader'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

type PaceKey = 'relaxed' | 'fast' | 'planned' | 'spontaneous' | 'photo'
type PlaceKey =
  | 'restaurant'
  | 'cafe'
  | 'nature'
  | 'landmark'
  | 'shopping'
  | 'activity'
  | 'culture'
  | 'night'
  | 'healing'
  | 'market'
type CompanionKey = 'solo' | 'couple' | 'family' | 'friends' | 'pet'

/** 라벨은 onboarding 네임스페이스가 이미 갖고 있어 키만 둔다 */
const PACE_KEYS: PaceKey[] = ['relaxed', 'fast', 'planned', 'spontaneous', 'photo']
const PLACE_KEYS: PlaceKey[] = [
  'restaurant',
  'cafe',
  'nature',
  'landmark',
  'shopping',
  'activity',
  'culture',
  'night',
  'healing',
  'market',
]
const COMPANION_KEYS: CompanionKey[] = ['solo', 'couple', 'family', 'friends', 'pet']

interface Props {
  displayName: string
  initials: string
  avatarUrl: string | null
  phone: string | null
  provider: string
  travelCompanion: string[]
  travelPace: string[]
  travelPlaces: string[]
}

export default function ProfileSettingsClient({
  displayName,
  initials,
  avatarUrl,
  phone,
  provider,
  travelCompanion,
  travelPace,
  travelPlaces,
}: Props) {
  const router = useRouter()
  const t = useTranslations('mypage')
  const to = useTranslations('onboarding')
  const tc = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const [isStylePending, startStyleTransition] = useTransition()

  const [nameValue, setNameValue] = useState(displayName)
  const [nameError, setNameError] = useState('')
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const [companion, setCompanion] = useState<string[]>(travelCompanion)
  const [pace, setPace] = useState<string[]>(travelPace)
  const [places, setPlaces] = useState<string[]>(travelPlaces)
  const [styleSaved, setStyleSaved] = useState(false)

  function toggle(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
    setStyleSaved(false)
  }

  function handleSaveName() {
    if (!nameValue.trim()) {
      setNameError(t('nameRequired'))
      return
    }
    startTransition(async () => {
      const res = await updateName(nameValue)
      if (res?.error) {
        setNameError(t('saveFailed'))
      } else {
        setNameError('')
        router.back()
      }
    })
  }

  function handleSaveStyle() {
    startStyleTransition(async () => {
      await updateTravelStyle({
        travel_companion: companion,
        travel_pace: pace,
        travel_places: places,
      })
      setStyleSaved(true)
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
    <div className="bg-bg2 min-h-dvh">
      <AppHeader title={t('profileTitle')} onBack="router" border />

      <div className="px-4 pt-6 pb-10">
        {/* 아바타 */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <label className="relative cursor-pointer">
            <div className="border-border h-20 w-20 overflow-hidden rounded-full border-2">
              {currentAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[28px] font-black text-white"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {initials}
                </div>
              )}
            </div>
            <div className="bg-primary absolute right-0 bottom-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white">
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
            <span className="text-ink3 text-[12px]">{to('avatarHint')}</span>
            {currentAvatarUrl && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={avatarUploading}
                className="text-error text-[12px] font-medium disabled:opacity-40"
              >
                {tc('delete')}
              </button>
            )}
          </div>
        </div>

        {/* 이름 */}
        <div className="border-border mb-5 overflow-hidden rounded-2xl border bg-white">
          <div className="px-4 pt-4 pb-3">
            <label className="text-ink3 mb-1.5 block text-[12px] font-semibold">{t('name')}</label>
            <input
              value={nameValue}
              onChange={(e) => {
                setNameValue(e.target.value)
                setNameError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="text-ink w-full bg-transparent text-[15px] outline-none"
              placeholder={t('namePlaceholder')}
              maxLength={20}
            />
            {nameError && <p className="mt-1 text-[12px] text-red-500">{nameError}</p>}
          </div>
        </div>

        {/* 전화번호 */}
        {phone && (
          <>
            <p className="text-ink3 mb-2 pl-1 text-[12px] font-semibold">{t('phoneNumber')}</p>
            <div className="border-border mb-5 overflow-hidden rounded-2xl border bg-white">
              <div className="px-4 py-3.5">
                <p className="text-ink text-[15px]">
                  {phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                </p>
              </div>
            </div>
          </>
        )}

        {/* 로그인 계정 */}
        <p className="text-ink3 mb-2 pl-1 text-[12px] font-semibold">{t('loginAccount')}</p>
        <div className="border-border mb-6 overflow-hidden rounded-2xl border bg-white">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <ProviderIcon provider={provider} />
            <span className="text-ink flex-1 text-[14px]">
              {provider === 'kakao'
                ? t('provider.kakao')
                : provider === 'google'
                  ? t('provider.google')
                  : t('provider.email')}
            </span>
            <Badge variant="blue">{t('primaryBadge')}</Badge>
          </div>
        </div>

        <Button onClick={handleSaveName} disabled={isPending} fullWidth>
          {isPending ? t('saving') : tc('save')}
        </Button>

        {/* 여행 취향 */}
        <div className="mt-8 mb-2">
          <p className="text-ink text-[15px] font-semibold">{t('stylePrefs')}</p>
          <p className="text-ink3 mt-0.5 text-[12px]">{t('stylePrefsDesc')}</p>
        </div>

        <div className="border-border mb-5 space-y-5 overflow-hidden rounded-2xl border bg-white px-4 py-4">
          <ChipSection
            label={to('paceLabel')}
            keys={PACE_KEYS}
            getLabel={(k) => to(`pace.${k}` as never)}
            selected={pace}
            onToggle={(v) => toggle(pace, v, setPace)}
          />
          <ChipSection
            label={to('placeLabel')}
            keys={PLACE_KEYS}
            getLabel={(k) => to(`place.${k}` as never)}
            selected={places}
            onToggle={(v) => toggle(places, v, setPlaces)}
          />
          <ChipSection
            label={to('companionLabel')}
            keys={COMPANION_KEYS}
            getLabel={(k) => to(`companion.${k}` as never)}
            selected={companion}
            onToggle={(v) => toggle(companion, v, setCompanion)}
          />
        </div>

        <Button
          onClick={handleSaveStyle}
          disabled={isStylePending || styleSaved}
          fullWidth
          variant={styleSaved ? 'secondary' : 'primary'}
        >
          {isStylePending ? t('saving') : styleSaved ? t('styleSaved') : t('styleSave')}
        </Button>
      </div>
    </div>
  )
}

function ChipSection({
  label,
  keys,
  getLabel,
  selected,
  onToggle,
}: {
  label: string
  keys: readonly string[]
  getLabel: (key: string) => string
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div>
      <div className="text-ink3 mb-2 text-[12px] font-semibold">{label}</div>
      <div className="flex flex-wrap gap-2">
        {keys.map((key) => {
          const optLabel = getLabel(key)
          const active = selected.includes(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={`h-9 rounded-full border-[1.5px] px-[14px] text-[13px] font-medium transition-colors ${
                active
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-border text-ink2 bg-white'
              }`}
            >
              {optLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'kakao')
    return (
      <div className="bg-kakao flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
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
    <div className="border-border flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border bg-white">
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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import StepIndicator from './StepIndicator'
import api, { isApiError } from '@/lib/axios/client'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function rawPhone(formatted: string): string {
  return formatted.replace(/-/g, '')
}

interface LinkingState {
  existingProvider: string
  existingUserId: string
}

interface Props {
  nickname: string
  onBack: () => void
  redirectTo?: string | null
}

export default function PhoneStep({ nickname, onBack, redirectTo }: Props) {
  const t = useTranslations('onboarding')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linking, setLinking] = useState<LinkingState | null>(null)
  const [linking_loading, setLinkingLoading] = useState(false)

  const handleSend = async () => {
    setError(null)
    setSending(true)
    try {
      await api.post('/api/find-account/send', { phone: rawPhone(phone) })
      setOtpSent(true)
    } catch (err) {
      setError(isApiError(err) ? tAuth(err.code as never) : tAuth('smsSendFailed'))
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    setError(null)
    setVerifying(true)
    try {
      await api.post('/api/social-phone-verify', { phone: rawPhone(phone), code: otp })
      await finish()
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        setLinking({
          existingProvider: (err.data.existingProvider as string) ?? '',
          existingUserId: (err.data.existingUserId as string) ?? '',
        })
      } else {
        setError(isApiError(err) ? tAuth(err.code as never) : tAuth('otpVerifyFailed'))
      }
    } finally {
      setVerifying(false)
    }
  }

  const handleSkip = async () => {
    await finish()
  }

  const handleLinkConfirm = async () => {
    if (!linking) return
    setLinkingLoading(true)
    try {
      const res = await api.post('/api/account-link', { primaryUserId: linking.existingUserId })
      const { primaryProvider } = res.data
      router.replace(`/${locale}?provider=${primaryProvider}`)
    } catch (err) {
      setError(isApiError(err) ? tAuth(err.code as never) : tAuth('saveFailed'))
      setLinking(null)
    } finally {
      setLinkingLoading(false)
    }
  }

  const finish = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({
          ...(nickname.trim() ? { name: nickname.trim() } : {}),
          onboarding_completed: true,
        })
        .eq('id', user.id)
    }
    router.push(redirectTo ?? `/${locale}/home`)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M13 16l-6-6 6-6"
                stroke="var(--color-ink3)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <StepIndicator current={3} total={3} />
        </div>
        <button onClick={handleSkip} className="text-ink3 text-[14px] font-medium">
          {t('skipPhone')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="mb-8">
          <div className="text-primary mb-1.5 text-[13px] font-medium">{t('step3Label')}</div>
          <h1 className="text-ink mb-2 text-[24px] leading-snug font-bold">{t('step3Title')}</h1>
          <p className="text-ink3 text-[14px] leading-relaxed">{t('step3Subtitle')}</p>
        </div>

        {/* 1개월 Pro 체험 혜택 안내 */}
        <div className="bg-primary-light mb-5 flex items-center gap-3 rounded-2xl px-4 py-3.5">
          <div className="bg-primary flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2l1.6 4.8H15l-3.9 2.8 1.5 4.7L9 11.6l-3.6 2.7 1.5-4.7L3 6.8h4.4z"
                fill="var(--color-kakao)"
              />
            </svg>
          </div>
          <div>
            <p className="text-primary text-[13px] font-bold">인증하면 1개월 Pro 무료체험</p>
            <p className="text-[12px] text-[#5A7FBF]">무제한 여행 · AI 추천 · 광고 없음</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-ink mb-2 block text-[13px] font-medium">{t('phoneLabel')}</label>
          <div className="flex gap-2">
            <div className="border-border flex h-[52px] flex-1 items-center rounded-xl border-[1.5px] bg-white px-4">
              <input
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder={t('phonePlaceholder')}
                inputMode="numeric"
                disabled={otpSent}
                className="text-ink placeholder:text-ink3 disabled:text-ink3 flex-1 bg-transparent text-[15px] outline-none"
              />
            </div>
            <Button
              onClick={otpSent ? handleSend : handleSend}
              disabled={rawPhone(phone).length < 10 || sending}
            >
              {sending ? t('otpSending') : otpSent ? t('resendOtp') : t('sendOtp')}
            </Button>
          </div>
        </div>

        {otpSent && (
          <div className="mb-6">
            <label className="text-ink mb-2 block text-[13px] font-medium">{t('otpLabel')}</label>
            <div className="border-primary flex h-[52px] items-center rounded-xl border-[1.5px] bg-white px-4 shadow-[0_0_0_3px_rgba(27,111,240,0.1)]">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('otpPlaceholder')}
                inputMode="numeric"
                className="text-ink placeholder:text-ink3 flex-1 bg-transparent text-[15px] tracking-[0.15em] outline-none placeholder:tracking-normal"
              />
            </div>
          </div>
        )}

        {error && <p className="text-error mb-4 text-[13px]">{error}</p>}

        {otpSent && (
          <Button onClick={handleVerify} disabled={otp.length < 6 || verifying} fullWidth>
            {verifying ? t('verifyingOtp') : t('verifyOtp')}
          </Button>
        )}
      </div>

      {linking && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !linking_loading && setLinking(null)}
          />
          <div className="relative w-full rounded-t-3xl bg-white px-6 pt-5 pb-10">
            <div className="bg-border mx-auto mb-5 h-1 w-10 rounded-full" />
            <div className="bg-primary-light mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M8 14h12M14 8v12"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="text-ink mb-2 text-[18px] font-bold">{t('linkingTitle')}</h2>
            <p className="text-ink3 mb-6 text-[14px] leading-relaxed">
              {t('linkingDesc')}
              {linking.existingProvider && (
                <>
                  {' '}
                  <span className="text-ink font-medium">
                    (
                    {tAuth(`provider.${linking.existingProvider}` as never) ??
                      linking.existingProvider}
                    )
                  </span>
                </>
              )}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleLinkConfirm} disabled={linking_loading} fullWidth>
                {t('linkingConfirm')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setLinking(null)}
                disabled={linking_loading}
                fullWidth
              >
                {t('linkingCancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

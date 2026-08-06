'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
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
                stroke="#9099A8"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <StepIndicator current={3} total={3} />
        </div>
        <button onClick={handleSkip} className="text-[14px] font-medium text-[#9099A8]">
          {t('skipPhone')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="mb-8">
          <div className="mb-1.5 text-[13px] font-medium text-[#1B6FF0]">{t('step3Label')}</div>
          <h1 className="mb-2 text-[24px] leading-snug font-bold text-[#0F1117]">
            {t('step3Title')}
          </h1>
          <p className="text-[14px] leading-relaxed text-[#9099A8]">{t('step3Subtitle')}</p>
        </div>

        {/* 1개월 Pro 체험 혜택 안내 */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#EBF2FF] px-4 py-3.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#1B6FF0]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2l1.6 4.8H15l-3.9 2.8 1.5 4.7L9 11.6l-3.6 2.7 1.5-4.7L3 6.8h4.4z"
                fill="#FEE500"
              />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#1B6FF0]">인증하면 1개월 Pro 무료체험</p>
            <p className="text-[12px] text-[#5A7FBF]">무제한 여행 · AI 추천 · 광고 없음</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-[13px] font-medium text-[#0F1117]">
            {t('phoneLabel')}
          </label>
          <div className="flex gap-2">
            <div className="flex h-[52px] flex-1 items-center rounded-xl border-[1.5px] border-[#E8EAED] bg-white px-4">
              <input
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder={t('phonePlaceholder')}
                inputMode="numeric"
                disabled={otpSent}
                className="flex-1 bg-transparent text-[15px] text-[#0F1117] outline-none placeholder:text-[#C5CAD3] disabled:text-[#9099A8]"
              />
            </div>
            <button
              onClick={otpSent ? handleSend : handleSend}
              disabled={rawPhone(phone).length < 10 || sending}
              className="h-[52px] rounded-xl bg-[#1B6FF0] px-4 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {sending ? t('otpSending') : otpSent ? t('resendOtp') : t('sendOtp')}
            </button>
          </div>
        </div>

        {otpSent && (
          <div className="mb-6">
            <label className="mb-2 block text-[13px] font-medium text-[#0F1117]">
              {t('otpLabel')}
            </label>
            <div className="flex h-[52px] items-center rounded-xl border-[1.5px] border-[#1B6FF0] bg-white px-4 shadow-[0_0_0_3px_rgba(27,111,240,0.1)]">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('otpPlaceholder')}
                inputMode="numeric"
                className="flex-1 bg-transparent text-[15px] tracking-[0.15em] text-[#0F1117] outline-none placeholder:tracking-normal placeholder:text-[#C5CAD3]"
              />
            </div>
          </div>
        )}

        {error && <p className="mb-4 text-[13px] text-[#F04438]">{error}</p>}

        {otpSent && (
          <button
            onClick={handleVerify}
            disabled={otp.length < 6 || verifying}
            className="h-[54px] w-full rounded-2xl bg-[#1B6FF0] text-[16px] font-semibold text-white disabled:opacity-40"
          >
            {verifying ? t('verifyingOtp') : t('verifyOtp')}
          </button>
        )}
      </div>

      {linking && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !linking_loading && setLinking(null)}
          />
          <div className="relative w-full rounded-t-3xl bg-white px-6 pt-5 pb-10">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#E8EAED]" />
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EBF2FF]">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M8 14h12M14 8v12" stroke="#1B6FF0" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="mb-2 text-[18px] font-bold text-[#0F1117]">{t('linkingTitle')}</h2>
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">
              {t('linkingDesc')}
              {linking.existingProvider && (
                <>
                  {' '}
                  <span className="font-medium text-[#0F1117]">
                    (
                    {tAuth(`provider.${linking.existingProvider}` as never) ??
                      linking.existingProvider}
                    )
                  </span>
                </>
              )}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLinkConfirm}
                disabled={linking_loading}
                className="h-[54px] w-full rounded-2xl bg-[#1B6FF0] text-[16px] font-semibold text-white disabled:opacity-40"
              >
                {t('linkingConfirm')}
              </button>
              <button
                onClick={() => setLinking(null)}
                disabled={linking_loading}
                className="h-[54px] w-full rounded-2xl border-[1.5px] border-[#E8EAED] text-[16px] font-medium text-[#515966]"
              >
                {t('linkingCancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

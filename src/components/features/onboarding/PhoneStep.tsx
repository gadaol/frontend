'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import PageLoading from '@/components/ui/PageLoading'
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

interface Props {
  onNext: () => void
}

export default function PhoneStep({ onNext }: Props) {
  const t = useTranslations('onboarding')
  const tAuth = useTranslations('auth')

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trialResult, setTrialResult] = useState<'granted' | 'already_used' | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(180)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current)
    },
    [],
  )

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleSend = async () => {
    setError(null)
    setSending(true)
    try {
      await api.post('/api/find-account/send', { phone: rawPhone(phone) })
      setOtpSent(true)
      startTimer()
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
      const res = await api.post('/api/social-phone-verify', { phone: rawPhone(phone), code: otp })
      if (res.data.trialGranted) {
        setTrialResult('granted')
        setTimeout(onNext, 2000)
      } else {
        setTrialResult('already_used')
      }
    } catch (err) {
      setError(isApiError(err) ? tAuth(err.code as never) : tAuth('otpVerifyFailed'))
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageLoading visible={sending || verifying} />
      <div className="flex items-center px-6 py-5">
        <StepIndicator current={1} total={3} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="mb-8">
          <div className="text-primary mb-1.5 text-[13px] font-medium">{t('step1Label')}</div>
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
            <Button onClick={handleSend} disabled={rawPhone(phone).length < 10 || sending}>
              {otpSent ? t('resendOtp') : t('sendOtp')}
            </Button>
          </div>
        </div>

        {otpSent && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-ink text-[13px] font-medium">{t('otpLabel')}</label>
              {timeLeft > 0 ? (
                <span className="text-primary text-[13px] font-medium tabular-nums">
                  {formatTime(timeLeft)}
                </span>
              ) : (
                <span className="text-error text-[13px]">만료됨</span>
              )}
            </div>
            <div
              className={`flex h-[52px] items-center rounded-xl border-[1.5px] bg-white px-4 ${timeLeft > 0 ? 'border-primary shadow-[0_0_0_3px_rgba(27,111,240,0.1)]' : 'border-red-300'}`}
            >
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('otpPlaceholder')}
                inputMode="numeric"
                disabled={timeLeft === 0}
                className="text-ink placeholder:text-ink3 disabled:text-ink3 flex-1 bg-transparent text-[15px] tracking-[0.15em] outline-none placeholder:tracking-normal"
              />
            </div>
            {timeLeft === 0 && (
              <p className="text-error mt-1.5 text-[12px]">
                인증번호가 만료됐어요. 다시 받아주세요.
              </p>
            )}
          </div>
        )}

        {trialResult === 'granted' && (
          <div className="bg-primary-light mb-4 flex items-center gap-3 rounded-2xl px-4 py-3.5">
            <span className="text-[20px]">🎉</span>
            <div>
              <p className="text-primary text-[13px] font-bold">1개월 Pro 무료체험 시작!</p>
              <p className="text-[12px] text-[#5A7FBF]">무제한 여행 · AI 추천 · 광고 없음</p>
            </div>
          </div>
        )}

        {trialResult === 'already_used' && (
          <div className="bg-surface mb-4 flex items-start gap-3 rounded-2xl px-4 py-3.5">
            <span className="text-[18px]">ℹ️</span>
            <div>
              <p className="text-ink text-[13px] font-bold">이 번호로 이미 무료체험을 사용했어요</p>
              <p className="text-ink3 text-[12px] leading-relaxed">
                Pro 기능은 구독 플랜으로 계속 이용할 수 있어요.
              </p>
            </div>
          </div>
        )}

        {error && <p className="text-error mb-4 text-[13px]">{error}</p>}

        {otpSent && !trialResult && (
          <Button onClick={handleVerify} disabled={otp.length < 6 || verifying} fullWidth>
            {t('verifyOtp')}
          </Button>
        )}

        {trialResult === 'already_used' && (
          <Button onClick={onNext} fullWidth>
            계속하기
          </Button>
        )}
      </div>
    </div>
  )
}

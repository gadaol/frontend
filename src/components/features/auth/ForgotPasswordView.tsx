'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import api, { isApiError } from '@/lib/axios/client'
import Button from '@/components/ui/Button'
import PageLoading from '@/components/ui/PageLoading'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

type Step = 'input' | 'otp' | 'password' | 'done'
type PasswordFormValues = { password: string; confirmPassword: string }

interface Props {
  onBack: () => void
}

export default function ForgotPasswordView({ onBack }: Props) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')

  const [step, setStep] = useState<Step>('input')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(180)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current)
    },
    [],
  )

  const pwSchema = z
    .object({
      password: z.string().min(6, t('passwordError')),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t('confirmPasswordError'),
      path: ['confirmPassword'],
    })

  const {
    register: regPw,
    handleSubmit: handlePwSubmit,
    formState: { errors: pwErrors, isSubmitting: pwSubmitting },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(pwSchema) })

  const handleSendOtp = async () => {
    if (!email.trim() || !phone.trim()) return
    setSending(true)
    setError(null)
    try {
      await api.post('/api/find-account/send', { phone })
      setStep('otp')
      startTimer()
    } catch (err) {
      setError(isApiError(err) ? t(err.code as never) : tc('error'))
    } finally {
      setSending(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return
    setVerifying(true)
    setError(null)
    try {
      await api.post('/api/find-account/verify', { phone, code: otp })
      setStep('password')
    } catch (err) {
      setError(isApiError(err) ? t(err.code as never) : tc('error'))
    } finally {
      setVerifying(false)
    }
  }

  const onPasswordSubmit = async ({ password }: PasswordFormValues) => {
    setPwError(null)
    try {
      await api.post('/api/reset-password/sms', { phone, email, newPassword: password })
      setStep('done')
    } catch (err) {
      setPwError(isApiError(err) ? t(err.code as never) : tc('error'))
    }
  }

  const backAction = () => {
    if (step === 'otp') return setStep('input')
    if (step === 'password') return setStep('otp')
    if (step === 'done') return onBack()
    onBack()
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="border-border flex h-14 flex-shrink-0 items-center gap-1 border-b px-4">
        <button
          onClick={backAction}
          className="flex h-10 w-10 items-center justify-center"
          aria-label={tc('back')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="var(--color-ink)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-ink text-[17px] font-semibold">{t('forgotPasswordTitle')}</span>
      </div>

      <div className="flex flex-1 flex-col px-5 py-6">
        {/* 이메일 + 전화번호 입력 */}
        {step === 'input' && (
          <>
            <p className="text-ink3 mb-6 text-[14px] leading-relaxed">
              {t('forgotPasswordSmsDesc')}
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-ink text-[13px] font-medium">{t('emailLabel')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@gadarog.com"
                  className="border-border text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] outline-none focus:ring-2"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-ink text-[13px] font-medium">{t('phoneLabel')}</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder={t('phonePlaceholder')}
                  className="border-border text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] outline-none focus:ring-2"
                />
              </div>
            </div>
            {error && <span className="text-error mt-2 text-[13px]">{error}</span>}
            <div className="mt-auto pt-8">
              <Button
                onClick={handleSendOtp}
                disabled={sending || !email.trim() || !phone.trim()}
                fullWidth
              >
                {sending ? t('otpSending') : t('sendOtp')}
              </Button>
            </div>
          </>
        )}

        {/* OTP 입력 */}
        {step === 'otp' && (
          <>
            <p className="text-ink3 mb-6 text-[14px] leading-relaxed">
              <span className="text-ink font-medium">{phone}</span>
              {t('otpSentDesc')}
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-ink text-[13px] font-medium">{t('otpLabel')}</label>
                {timeLeft > 0 ? (
                  <span className="text-primary text-[13px] font-medium tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                ) : (
                  <span className="text-error text-[13px]">{t('otpExpired')}</span>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder={t('otpPlaceholder')}
                disabled={timeLeft === 0}
                className={`text-ink disabled:text-ink3 h-12 rounded-xl border px-3.5 text-[15px] tracking-widest outline-none focus:ring-2 ${timeLeft > 0 ? 'border-primary focus:border-primary focus:ring-primary/10' : 'border-red-300'}`}
              />
              {timeLeft === 0 && <p className="text-error text-[12px]">{t('otpExpiredDesc')}</p>}
            </div>
            {error && <span className="text-error mt-2 text-[13px]">{error}</span>}
            <button
              onClick={async () => {
                setOtp('')
                setError(null)
                await handleSendOtp()
              }}
              disabled={sending}
              className="text-primary mt-3 self-start text-[13px] font-medium disabled:opacity-50"
            >
              {sending ? t('otpSending') : t('resendOtp')}
            </button>
            <div className="mt-auto pt-8">
              <Button
                onClick={handleVerifyOtp}
                disabled={otp.length < 6 || verifying || timeLeft === 0}
                fullWidth
              >
                {verifying ? t('processing') : t('verifyOtp')}
              </Button>
            </div>
          </>
        )}

        {/* 새 비밀번호 입력 */}
        {step === 'password' && (
          <form onSubmit={handlePwSubmit(onPasswordSubmit)} className="flex flex-1 flex-col">
            <p className="text-ink3 mb-6 text-[14px] leading-relaxed">{t('newPasswordTitle')}</p>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-ink text-[13px] font-medium">{t('newPasswordLabel')}</label>
                <input
                  {...regPw('password')}
                  type="password"
                  placeholder="••••••••"
                  className={`text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] outline-none focus:ring-2 ${pwErrors.password ? 'border-error' : 'border-border'}`}
                />
                {pwErrors.password && (
                  <span className="text-error text-[12px]">{pwErrors.password.message}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-ink text-[13px] font-medium">
                  {t('confirmNewPasswordLabel')}
                </label>
                <input
                  {...regPw('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  className={`text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] outline-none focus:ring-2 ${pwErrors.confirmPassword ? 'border-error' : 'border-border'}`}
                />
                {pwErrors.confirmPassword && (
                  <span className="text-error text-[12px]">{pwErrors.confirmPassword.message}</span>
                )}
              </div>
              {pwError && <span className="text-error text-[13px]">{pwError}</span>}
            </div>
            <div className="mt-auto pt-8">
              <Button type="submit" disabled={pwSubmitting} fullWidth>
                {pwSubmitting ? t('processing') : t('setNewPassword')}
              </Button>
            </div>
          </form>
        )}

        {/* 완료 */}
        {step === 'done' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="bg-primary-light mb-6 flex h-16 w-16 items-center justify-center rounded-full">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="13" stroke="var(--color-primary)" strokeWidth="2" />
                <path
                  d="M10 16l4 4 8-8"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-ink mb-2 text-[20px] font-bold">{t('resetPasswordDoneTitle')}</h2>
            <p className="text-ink3 text-[14px]">{t('resetPasswordSuccessDesc')}</p>
            <div className="mt-auto w-full pt-8">
              <Button onClick={onBack} fullWidth>
                {t('goToLogin')}
              </Button>
            </div>
          </div>
        )}
      </div>
      <PageLoading visible={sending || verifying || pwSubmitting} />
    </div>
  )
}

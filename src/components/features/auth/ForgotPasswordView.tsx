'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import api, { isApiError } from '@/lib/axios/client'
import Button from '@/components/ui/Button'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

type Method = 'email' | 'sms'
type SmsStep = 'phone' | 'otp' | 'password' | 'done'
type EmailFormValues = { email: string }
type PasswordFormValues = { password: string; confirmPassword: string }

interface Props {
  onBack: () => void
}

export default function ForgotPasswordView({ onBack }: Props) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()

  const [method, setMethod] = useState<Method>('email')

  // 이메일 상태
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [emailServerError, setEmailServerError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  // SMS 상태
  const [smsStep, setSmsStep] = useState<SmsStep>('phone')
  const [phone, setPhone] = useState('')
  const [smsEmail, setSmsEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [smsError, setSmsError] = useState<string | null>(null)
  const [pwServerError, setPwServerError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(180)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // 이메일 폼
  const emailSchema = z.object({ email: z.string().email(t('emailError')) })
  const {
    register: regEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isSubmitting: emailSubmitting },
  } = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) })

  // 비밀번호 폼
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

  const onEmailSubmit = async ({ email }: EmailFormValues) => {
    setEmailServerError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? location.origin}/${locale}/auth/callback?next=reset-password`,
    })
    if (error) return setEmailServerError(error.message)
    setSentEmail(email)
  }

  const handleResend = async () => {
    if (!sentEmail || resending) return
    setResending(true)
    setEmailServerError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(sentEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? location.origin}/${locale}/auth/callback?next=reset-password`,
    })
    setResending(false)
    if (error) {
      setEmailServerError(error.message)
    } else {
      setResent(true)
      setTimeout(() => setResent(false), 3000)
    }
  }

  const handleSendOtp = async () => {
    if (!phone.trim() || !smsEmail.trim()) return
    setSending(true)
    setSmsError(null)
    try {
      await api.post('/api/find-account/send', { phone })
      setSmsStep('otp')
      startTimer()
    } catch (err) {
      setSmsError(isApiError(err) ? t(err.code as never) : tc('error'))
    } finally {
      setSending(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return
    setVerifyingOtp(true)
    setSmsError(null)
    try {
      await api.post('/api/find-account/verify', { phone, code: otp })
      setSmsStep('password')
    } catch (err) {
      setSmsError(isApiError(err) ? t(err.code as never) : tc('error'))
    } finally {
      setVerifyingOtp(false)
    }
  }

  const onPasswordSubmit = async ({ password }: PasswordFormValues) => {
    setPwServerError(null)
    try {
      await api.post('/api/reset-password/sms', {
        phone,
        email: smsEmail,
        newPassword: password,
      })
      setSmsStep('done')
    } catch (err) {
      setPwServerError(isApiError(err) ? t(err.code as never) : tc('error'))
    }
  }

  const handleMethodChange = (m: Method) => {
    setMethod(m)
    setSmsStep('phone')
    setSentEmail(null)
    setSmsError(null)
    setEmailServerError(null)
    setOtp('')
    setSmsEmail('')
  }

  const isEmailSent = method === 'email' && !!sentEmail
  const showTabs = !isEmailSent && !(method === 'sms' && smsStep === 'password')

  const backAction = () => {
    if (method === 'sms') {
      if (smsStep === 'otp') return setSmsStep('phone')
      if (smsStep === 'password') return setSmsStep('otp')
      if (smsStep === 'done') return onBack()
    }
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

      {/* 탭 */}
      {showTabs && (
        <div className="border-border flex border-b">
          {(['email', 'sms'] as Method[]).map((m) => (
            <button
              key={m}
              onClick={() => handleMethodChange(m)}
              className={`flex-1 py-3 text-[14px] font-medium transition-colors ${
                method === m ? 'border-primary text-primary border-b-2' : 'text-ink3'
              }`}
            >
              {m === 'email' ? t('methodEmailTab') : t('methodSms')}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col px-5 py-6">
        {/* 이메일 - 입력 */}
        {method === 'email' && !sentEmail && (
          <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="flex flex-1 flex-col">
            <p className="text-ink3 mb-6 text-[14px] leading-relaxed">{t('forgotPasswordDesc')}</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-ink text-[13px] font-medium">{t('emailLabel')}</label>
              <input
                {...regEmail('email')}
                type="email"
                placeholder="hello@gadaol.com"
                className={`text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] outline-none focus:ring-2 ${
                  emailErrors.email ? 'border-error' : 'border-border'
                }`}
              />
              {emailErrors.email && (
                <span className="text-error text-[12px]">{emailErrors.email.message}</span>
              )}
            </div>
            {emailServerError && (
              <span className="text-error mt-2 text-[13px]">{emailServerError}</span>
            )}
            <div className="mt-auto pt-8">
              <Button type="submit" disabled={emailSubmitting} fullWidth>
                {emailSubmitting ? t('processing') : t('sendResetLink')}
              </Button>
            </div>
          </form>
        )}

        {/* 이메일 - 발송 완료 */}
        {method === 'email' && sentEmail && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="bg-primary-light mb-6 flex h-16 w-16 items-center justify-center rounded-full">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect
                  x="3"
                  y="8"
                  width="26"
                  height="18"
                  rx="3"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                />
                <path
                  d="M3 12l13 8 13-8"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="text-ink mb-2 text-[20px] font-bold">{t('resetLinkSentTitle')}</h2>
            <p className="text-ink3 text-[14px] leading-relaxed">
              <span className="text-ink font-medium">{sentEmail}</span>
              {t('resetLinkSentDesc')}
            </p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary mt-6 text-[14px] font-medium disabled:opacity-50"
            >
              {resending ? t('processing') : t('resendEmail')}
            </button>
            {resent && <span className="text-primary mt-2 text-[13px]">{t('resendSuccess')}</span>}
            <div className="mt-auto w-full pt-8">
              <button
                onClick={onBack}
                className="border-border text-ink h-[52px] w-full rounded-xl border text-[15px] font-medium"
              >
                {t('backToLogin')}
              </button>
            </div>
          </div>
        )}

        {/* SMS - 전화번호 입력 */}
        {method === 'sms' && smsStep === 'phone' && (
          <>
            <p className="text-ink3 mb-6 text-[14px] leading-relaxed">
              {t('forgotPasswordSmsDesc')}
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-ink text-[13px] font-medium">{t('emailLabel')}</label>
                <input
                  type="email"
                  value={smsEmail}
                  onChange={(e) => setSmsEmail(e.target.value)}
                  placeholder="hello@gadaol.com"
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
            {smsError && <span className="text-error mt-2 text-[13px]">{smsError}</span>}
            <div className="mt-auto pt-8">
              <Button onClick={handleSendOtp} disabled={sending || !phone.trim() || !smsEmail.trim()} fullWidth>
                {sending ? t('otpSending') : t('sendOtp')}
              </Button>
            </div>
          </>
        )}

        {/* SMS - OTP 입력 */}
        {method === 'sms' && smsStep === 'otp' && (
          <>
            <p className="text-ink3 mb-6 text-[14px] leading-relaxed">
              <span className="text-ink font-medium">{phone}</span>
              {t('otpSentDesc')}
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-ink text-[13px] font-medium">{t('otpLabel')}</label>
                {timeLeft > 0 ? (
                  <span className="text-primary text-[13px] font-medium tabular-nums">{formatTime(timeLeft)}</span>
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
                className={`text-ink h-12 rounded-xl border px-3.5 text-[15px] tracking-widest outline-none focus:ring-2 disabled:text-ink3 ${timeLeft > 0 ? 'border-primary focus:border-primary focus:ring-primary/10' : 'border-red-300'}`}
              />
              {timeLeft === 0 && (
                <p className="text-error text-[12px]">{t('otpExpiredDesc')}</p>
              )}
            </div>
            {smsError && <span className="text-error mt-2 text-[13px]">{smsError}</span>}
            <button
              onClick={async () => { setOtp(''); setSmsError(null); await handleSendOtp() }}
              disabled={sending}
              className="text-primary mt-3 self-start text-[13px] font-medium disabled:opacity-50"
            >
              {sending ? t('otpSending') : t('resendOtp')}
            </button>
            <div className="mt-auto pt-8">
              <Button onClick={handleVerifyOtp} disabled={otp.length < 6 || verifyingOtp || timeLeft === 0} fullWidth>
                {verifyingOtp ? t('processing') : t('verifyOtp')}
              </Button>
            </div>
          </>
        )}

        {/* SMS - 새 비밀번호 입력 */}
        {method === 'sms' && smsStep === 'password' && (
          <form onSubmit={handlePwSubmit(onPasswordSubmit)} className="flex flex-1 flex-col">
            <p className="text-ink3 mb-6 text-[14px] leading-relaxed">{t('newPasswordTitle')}</p>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-ink text-[13px] font-medium">{t('newPasswordLabel')}</label>
                <input
                  {...regPw('password')}
                  type="password"
                  placeholder="••••••••"
                  className={`text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] outline-none focus:ring-2 ${
                    pwErrors.password ? 'border-error' : 'border-border'
                  }`}
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
                  className={`text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] outline-none focus:ring-2 ${
                    pwErrors.confirmPassword ? 'border-error' : 'border-border'
                  }`}
                />
                {pwErrors.confirmPassword && (
                  <span className="text-error text-[12px]">{pwErrors.confirmPassword.message}</span>
                )}
              </div>
              {pwServerError && <span className="text-error text-[13px]">{pwServerError}</span>}
            </div>
            <div className="mt-auto pt-8">
              <Button type="submit" disabled={pwSubmitting} fullWidth>
                {pwSubmitting ? t('processing') : t('setNewPassword')}
              </Button>
            </div>
          </form>
        )}

        {/* SMS - 변경 완료 */}
        {method === 'sms' && smsStep === 'done' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="bg-primary-light mb-6 flex h-16 w-16 items-center justify-center rounded-full">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="13" stroke="var(--color-primary)" strokeWidth="2" />
                <path d="M10 16l4 4 8-8" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-ink mb-2 text-[20px] font-bold">{t('resetPasswordDoneTitle')}</h2>
            <p className="text-ink3 text-[14px]">{t('resetPasswordSuccessDesc')}</p>
            <div className="mt-auto w-full pt-8">
              <Button onClick={onBack} fullWidth>{t('goToLogin')}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

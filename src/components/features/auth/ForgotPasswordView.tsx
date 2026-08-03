'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useLocale, useTranslations } from 'next-intl'
import axios from 'axios'

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
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [smsError, setSmsError] = useState<string | null>(null)
  const [pwServerError, setPwServerError] = useState<string | null>(null)

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
      redirectTo: `${location.origin}/${locale}/auth/callback?next=reset-password`,
    })
    if (error) return setEmailServerError(error.message)
    setSentEmail(email)
  }

  const handleResend = async () => {
    if (!sentEmail || resending) return
    setResending(true)
    await supabase.auth.resetPasswordForEmail(sentEmail, {
      redirectTo: `${location.origin}/${locale}/auth/callback?next=reset-password`,
    })
    setResending(false)
    setResent(true)
    setTimeout(() => setResent(false), 3000)
  }

  const handleSendOtp = async () => {
    if (!phone.trim()) return
    setSending(true)
    setSmsError(null)
    try {
      await axios.post('/api/find-account/send', { phone })
      setSmsStep('otp')
    } catch (err) {
      if (axios.isAxiosError(err)) setSmsError(err.response?.data?.error ?? tc('error'))
      else setSmsError(tc('error'))
    } finally {
      setSending(false)
    }
  }

  const handleVerifyOtp = () => {
    if (otp.length < 6) return
    setSmsStep('password')
  }

  const onPasswordSubmit = async ({ password }: PasswordFormValues) => {
    setPwServerError(null)
    try {
      await axios.post('/api/reset-password/sms', { phone, code: otp, newPassword: password })
      setSmsStep('done')
    } catch (err) {
      if (axios.isAxiosError(err)) setPwServerError(err.response?.data?.error ?? tc('error'))
      else setPwServerError(tc('error'))
    }
  }

  const handleMethodChange = (m: Method) => {
    setMethod(m)
    setSmsStep('phone')
    setSentEmail(null)
    setSmsError(null)
    setEmailServerError(null)
    setOtp('')
  }

  const isEmailSent = method === 'email' && !!sentEmail
  const isSmsResult = method === 'sms' && smsStep === 'done'
  const showTabs = !isEmailSent && !isSmsResult && !(method === 'sms' && smsStep === 'password')

  const backAction = () => {
    if (method === 'sms') {
      if (smsStep === 'otp') return setSmsStep('phone')
      if (smsStep === 'password') return setSmsStep('otp')
    }
    onBack()
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="flex h-14 flex-shrink-0 items-center gap-1 border-b border-[#E8EAED] px-4">
        <button
          onClick={backAction}
          className="flex h-10 w-10 items-center justify-center"
          aria-label={tc('back')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#0F1117" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[17px] font-semibold text-[#0F1117]">{t('forgotPasswordTitle')}</span>
      </div>

      {/* 탭 */}
      {showTabs && (
        <div className="flex border-b border-[#E8EAED]">
          {(['email', 'sms'] as Method[]).map((m) => (
            <button
              key={m}
              onClick={() => handleMethodChange(m)}
              className={`flex-1 py-3 text-[14px] font-medium transition-colors ${
                method === m
                  ? 'border-b-2 border-[#1B6FF0] text-[#1B6FF0]'
                  : 'text-[#9099A8]'
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
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">{t('forgotPasswordDesc')}</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#0F1117]">{t('emailLabel')}</label>
              <input
                {...regEmail('email')}
                type="email"
                placeholder="hello@gadaol.com"
                className={`h-12 rounded-xl border px-3.5 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10 ${
                  emailErrors.email ? 'border-[#F04438]' : 'border-[#E8EAED]'
                }`}
              />
              {emailErrors.email && <span className="text-[12px] text-[#F04438]">{emailErrors.email.message}</span>}
            </div>
            {emailServerError && <span className="mt-2 text-[13px] text-[#F04438]">{emailServerError}</span>}
            <div className="mt-auto pt-8">
              <button
                type="submit"
                disabled={emailSubmitting}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {emailSubmitting ? t('processing') : t('sendResetLink')}
              </button>
            </div>
          </form>
        )}

        {/* 이메일 - 발송 완료 */}
        {method === 'email' && sentEmail && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF2FF]">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="3" y="8" width="26" height="18" rx="3" stroke="#1B6FF0" strokeWidth="2" />
                <path d="M3 12l13 8 13-8" stroke="#1B6FF0" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="mb-2 text-[20px] font-bold text-[#0F1117]">{t('resetLinkSentTitle')}</h2>
            <p className="text-[14px] leading-relaxed text-[#9099A8]">
              <span className="font-medium text-[#0F1117]">{sentEmail}</span>
              {t('resetLinkSentDesc')}
            </p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="mt-8 text-[14px] font-medium text-[#1B6FF0] disabled:opacity-50"
            >
              {resending ? t('processing') : t('resendEmail')}
            </button>
            {resent && <span className="mt-2 text-[13px] text-[#1B6FF0]">{t('resendSuccess')}</span>}
          </div>
        )}

        {/* SMS - 전화번호 입력 */}
        {method === 'sms' && smsStep === 'phone' && (
          <>
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">{t('forgotPasswordSmsDesc')}</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#0F1117]">{t('phoneLabel')}</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder={t('phonePlaceholder')}
                className="h-12 rounded-xl border border-[#E8EAED] px-3.5 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10"
              />
            </div>
            {smsError && <span className="mt-2 text-[13px] text-[#F04438]">{smsError}</span>}
            <div className="mt-auto pt-8">
              <button
                onClick={handleSendOtp}
                disabled={sending || !phone.trim()}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {sending ? t('otpSending') : t('sendOtp')}
              </button>
            </div>
          </>
        )}

        {/* SMS - OTP 입력 */}
        {method === 'sms' && smsStep === 'otp' && (
          <>
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">
              <span className="font-medium text-[#0F1117]">{phone}</span>{t('otpSentDesc')}
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#0F1117]">{t('otpLabel')}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder={t('otpPlaceholder')}
                className="h-12 rounded-xl border border-[#E8EAED] px-3.5 text-[15px] tracking-widest text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10"
              />
            </div>
            {smsError && <span className="mt-2 text-[13px] text-[#F04438]">{smsError}</span>}
            <button
              onClick={async () => { setOtp(''); setSmsError(null); await handleSendOtp() }}
              disabled={sending}
              className="mt-3 self-start text-[13px] font-medium text-[#1B6FF0] disabled:opacity-50"
            >
              {sending ? t('otpSending') : t('resendOtp')}
            </button>
            <div className="mt-auto pt-8">
              <button
                onClick={handleVerifyOtp}
                disabled={otp.length < 6}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {t('verifyOtp')}
              </button>
            </div>
          </>
        )}

        {/* SMS - 새 비밀번호 입력 */}
        {method === 'sms' && smsStep === 'password' && (
          <form onSubmit={handlePwSubmit(onPasswordSubmit)} className="flex flex-1 flex-col">
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">{t('newPasswordTitle')}</p>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#0F1117]">{t('newPasswordLabel')}</label>
                <input
                  {...regPw('password')}
                  type="password"
                  placeholder="••••••••"
                  className={`h-12 rounded-xl border px-3.5 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10 ${
                    pwErrors.password ? 'border-[#F04438]' : 'border-[#E8EAED]'
                  }`}
                />
                {pwErrors.password && <span className="text-[12px] text-[#F04438]">{pwErrors.password.message}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#0F1117]">{t('confirmNewPasswordLabel')}</label>
                <input
                  {...regPw('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  className={`h-12 rounded-xl border px-3.5 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10 ${
                    pwErrors.confirmPassword ? 'border-[#F04438]' : 'border-[#E8EAED]'
                  }`}
                />
                {pwErrors.confirmPassword && (
                  <span className="text-[12px] text-[#F04438]">{pwErrors.confirmPassword.message}</span>
                )}
              </div>
              {pwServerError && <span className="text-[13px] text-[#F04438]">{pwServerError}</span>}
            </div>
            <div className="mt-auto pt-8">
              <button
                type="submit"
                disabled={pwSubmitting}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {pwSubmitting ? t('processing') : t('setNewPassword')}
              </button>
            </div>
          </form>
        )}

        {/* SMS - 완료 */}
        {method === 'sms' && smsStep === 'done' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF2FF]">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 16l5 5 11-11" stroke="#1B6FF0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="mb-2 text-[20px] font-bold text-[#0F1117]">{t('resetPasswordSuccess')}</h2>
            <div className="mt-auto pt-8 w-full">
              <button
                onClick={onBack}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white"
              >
                {t('goToLogin')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

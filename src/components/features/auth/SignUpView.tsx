'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useLocale, useTranslations } from 'next-intl'
import axios from 'axios'

type Step = 'phone' | 'otp' | 'info'

type InfoValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface Props {
  onBack: () => void
  onVerificationSent: (email: string) => void
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export default function SignUpView({ onBack, onVerificationSent }: Props) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const infoSchema = z
    .object({
      name: z.string().min(1, t('nameError')),
      email: z.string().email(t('emailError')),
      password: z.string().min(6, t('passwordError')),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t('confirmPasswordError'),
      path: ['confirmPassword'],
    })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InfoValues>({ resolver: zodResolver(infoSchema) })

  const handleSendOtp = async () => {
    if (!phone || phone.length < 13) return
    setSending(true)
    setError(null)
    try {
      await axios.post('/api/find-account/send', { phone })
      setStep('otp')
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error ?? tc('error'))
      else setError(tc('error'))
    } finally {
      setSending(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return
    setVerifying(true)
    setError(null)
    try {
      await axios.post('/api/verify-phone', { phone, code: otp })
      setStep('info')
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error ?? tc('error'))
      else setError(tc('error'))
    } finally {
      setVerifying(false)
    }
  }

  const onSubmit = async ({ name, email, password }: InfoValues) => {
    setServerError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? location.origin}/${locale}/auth/callback`,
      },
    })
    if (error) return setServerError(error.message)
    onVerificationSent(email)
  }

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone')
      setOtp('')
      setError(null)
    } else if (step === 'info') {
      setStep('otp')
      setError(null)
    } else onBack()
  }

  const titles: Record<Step, string> = {
    phone: t('signupTitle'),
    otp: t('signupTitle'),
    info: t('signupTitle'),
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="flex h-14 flex-shrink-0 items-center gap-1 border-b border-[#E8EAED] px-4">
        <button
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center"
          aria-label={tc('back')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#0F1117"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-[17px] font-semibold text-[#0F1117]">{titles[step]}</span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
        {step === 'phone' && (
          <>
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">
              {t('signupPhoneDesc')}
            </p>
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
            {error && <span className="mt-2 text-[13px] text-[#F04438]">{error}</span>}
            <div className="mt-auto pt-8">
              <button
                onClick={handleSendOtp}
                disabled={sending || phone.length < 13}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {sending ? t('otpSending') : t('sendOtp')}
              </button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">
              <span className="font-medium text-[#0F1117]">{phone}</span>
              {t('otpSentDesc')}
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
            {error && <span className="mt-2 text-[13px] text-[#F04438]">{error}</span>}
            <button
              onClick={async () => {
                setOtp('')
                setError(null)
                await handleSendOtp()
              }}
              disabled={sending}
              className="mt-3 self-start text-[13px] font-medium text-[#1B6FF0] disabled:opacity-50"
            >
              {sending ? t('otpSending') : t('resendOtp')}
            </button>
            <div className="mt-auto pt-8">
              <button
                onClick={handleVerifyOtp}
                disabled={verifying || otp.length < 6}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {verifying ? t('processing') : t('verifyOtp')}
              </button>
            </div>
          </>
        )}

        {step === 'info' && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col">
            <div className="flex flex-col gap-5">
              <Field label={t('nameLabel')} error={errors.name?.message}>
                <input
                  {...register('name')}
                  type="text"
                  placeholder={t('namePlaceholder')}
                  className={inputClass(!!errors.name)}
                />
              </Field>

              <Field label={t('emailLabel')} error={errors.email?.message}>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="hello@gadaol.com"
                  className={inputClass(!!errors.email)}
                />
              </Field>

              <Field label={t('passwordLabel')} error={errors.password?.message}>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className={inputClass(!!errors.password)}
                />
              </Field>

              <Field label={t('confirmPasswordLabel')} error={errors.confirmPassword?.message}>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  className={inputClass(!!errors.confirmPassword)}
                />
              </Field>

              {serverError && <span className="text-[13px] text-[#F04438]">{serverError}</span>}
            </div>

            <div className="mt-auto pt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {isSubmitting ? t('processing') : t('signupAction')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#0F1117]">{label}</label>
      {children}
      {error && <span className="text-[12px] text-[#F04438]">{error}</span>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `h-12 rounded-xl border px-3.5 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10 ${
    hasError ? 'border-[#F04438]' : 'border-[#E8EAED]'
  }`
}

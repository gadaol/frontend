'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useLocale, useTranslations } from 'next-intl'

type FormValues = { email: string }

interface Props {
  onBack: () => void
}

export default function ForgotPasswordView({ onBack }: Props) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale()
  const supabase = createClient()
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const schema = z.object({
    email: z.string().email(t('emailError')),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }: FormValues) => {
    setServerError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/${locale}/auth/callback?next=reset-password`,
    })
    if (error) return setServerError(error.message)
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

  if (sentEmail) {
    return (
      <div className="flex flex-1 flex-col bg-white">
        <div className="flex h-14 flex-shrink-0 items-center gap-1 border-b border-[#E8EAED] px-4">
          <button
            onClick={onBack}
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
          <span className="text-[17px] font-semibold text-[#0F1117]">
            {t('resetLinkSentTitle')}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
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

          {resent && (
            <span className="mt-2 text-[13px] text-[#1B6FF0]">{t('resendSuccess')}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="flex h-14 flex-shrink-0 items-center gap-1 border-b border-[#E8EAED] px-4">
        <button
          onClick={onBack}
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
        <span className="text-[17px] font-semibold text-[#0F1117]">{t('forgotPasswordTitle')}</span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col overflow-y-auto px-5 py-6"
      >
        <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">{t('forgotPasswordDesc')}</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#0F1117]">{t('emailLabel')}</label>
          <input
            {...register('email')}
            type="email"
            placeholder="hello@gadaol.com"
            className={`h-12 rounded-xl border px-3.5 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10 ${
              errors.email ? 'border-[#F04438]' : 'border-[#E8EAED]'
            }`}
          />
          {errors.email && (
            <span className="text-[12px] text-[#F04438]">{errors.email.message}</span>
          )}
        </div>

        {serverError && (
          <span className="mt-2 text-[13px] text-[#F04438]">{serverError}</span>
        )}

        <div className="mt-auto pt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? t('processing') : t('sendResetLink')}
          </button>
        </div>
      </form>
    </div>
  )
}

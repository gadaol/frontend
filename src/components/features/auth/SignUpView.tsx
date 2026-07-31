'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useLocale, useTranslations } from 'next-intl'

type FormValues = {
  name: string
  phone: string
  email: string
  password: string
  confirmPassword: string
}

interface Props {
  onBack: () => void
  onVerificationSent: (email: string) => void
}

export default function SignUpView({ onBack, onVerificationSent }: Props) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale()
  const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = z
    .object({
      name: z.string().min(1, t('nameError')),
      phone: z
        .string()
        .regex(/^[0-9]{9,11}$|^010-\d{4}-\d{4}$|^01[0-9]-\d{3,4}-\d{4}$/, t('phoneError')),
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
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ name, phone, email, password }: FormValues) => {
    setServerError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        emailRedirectTo: `${location.origin}/${locale}/auth/callback`,
      },
    })

    if (error) return setServerError(error.message)
    onVerificationSent(email)
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
        <span className="text-[17px] font-semibold text-[#0F1117]">{t('signupTitle')}</span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col overflow-y-auto px-5 py-6"
      >
        <div className="flex flex-col gap-5">
          <Field label={t('nameLabel')} error={errors.name?.message}>
            <input
              {...register('name')}
              type="text"
              placeholder={t('namePlaceholder')}
              className={inputClass(!!errors.name)}
            />
          </Field>

          <Field label={t('phoneLabel')} error={errors.phone?.message}>
            <input
              {...register('phone')}
              type="tel"
              placeholder={t('phonePlaceholder')}
              className={inputClass(!!errors.phone)}
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

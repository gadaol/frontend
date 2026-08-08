'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios/client'
import Button from '@/components/ui/Button'
import PageLoading from '@/components/ui/PageLoading'

type FormValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface Props {
  onBack: () => void
  onVerificationSent: (email: string) => void
}

export default function SignUpView({ onBack, onVerificationSent }: Props) {
  const ta = useTranslations('auth')
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [termsChecked, setTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const allChecked = termsChecked && privacyChecked

  const schema = z
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
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ name, email, password }: FormValues) => {
    setServerError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) {
      if (
        error.message.includes('already registered') ||
        error.message.includes('already exists')
      ) {
        try {
          const res = await api.post<{ provider: string | null }>('/api/check-email-provider', {
            email,
          })
          const { provider } = res.data
          if (provider === 'kakao') return setServerError(t('duplicateAccountKakao'))
          if (provider === 'google') return setServerError(t('duplicateAccountGoogle'))
        } catch {
          // ignore
        }
        return setServerError(t('emailAlreadyRegistered'))
      }
      return setServerError(error.message)
    }
    // 약관 동의 기록
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ terms_agreed_at: new Date().toISOString() })
        .eq('id', data.user.id)
        .is('terms_agreed_at', null)
    }
    // Confirm email OFF: 세션 즉시 발급 → 온보딩
    if (data.session) {
      router.replace(`/${locale}/onboarding`)
      return
    }
    // Confirm email ON: 인증메일 발송됨
    onVerificationSent(email)
  }

  const toggleAll = () => {
    const next = !allChecked
    setTermsChecked(next)
    setPrivacyChecked(next)
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="border-border flex h-14 flex-shrink-0 items-center gap-1 border-b px-4">
        <button
          onClick={onBack}
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
        <span className="text-ink text-[17px] font-semibold">{t('signupTitle')}</span>
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

          <Field label={t('emailLabel')} error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="hello@gadarog.com"
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

          {/* 약관 동의 */}
          <div className="border-border rounded-xl border p-4">
            <button
              type="button"
              onClick={toggleAll}
              className="mb-3 flex w-full items-center gap-3"
            >
              <CheckCircle checked={allChecked} />
              <span className="text-ink text-[14px] font-semibold">{ta('agreeAll')}</span>
            </button>
            <div className="border-border flex flex-col gap-3 border-t pt-3">
              <button
                type="button"
                onClick={() => setTermsChecked(!termsChecked)}
                className="flex items-center gap-3"
              >
                <CheckCircle checked={termsChecked} size={20} />
                <span className="text-ink3 text-[13px]">{t('termsAgreeTerms')}</span>
              </button>
              <button
                type="button"
                onClick={() => setPrivacyChecked(!privacyChecked)}
                className="flex items-center gap-3"
              >
                <CheckCircle checked={privacyChecked} size={20} />
                <span className="text-ink3 text-[13px]">{t('termsAgreePrivacy')}</span>
              </button>
            </div>
          </div>

          {serverError && <span className="text-error text-[13px]">{serverError}</span>}
        </div>

        <div className="mt-auto pt-8">
          <Button type="submit" disabled={isSubmitting || !allChecked} fullWidth>
            {isSubmitting ? t('processing') : t('signupAction')}
          </Button>
        </div>
      </form>
      <PageLoading visible={isSubmitting} />
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
      <label className="text-ink text-[13px] font-medium">{label}</label>
      {children}
      {error && <span className="text-error text-[12px]">{error}</span>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `h-12 rounded-xl border px-3.5 text-[15px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 ${
    hasError ? 'border-error' : 'border-border'
  }`
}

function CheckCircle({ checked, size = 24 }: { checked: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
      <circle
        cx="12"
        cy="12"
        r="11"
        fill={checked ? 'var(--color-primary)' : 'transparent'}
        stroke={checked ? 'var(--color-primary)' : 'var(--color-border)'}
        strokeWidth="1.5"
      />
      <path
        d="M7.5 12l3 3 6-6"
        stroke={checked ? 'white' : 'var(--color-border)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

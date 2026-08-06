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
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null)

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
        // 어떤 소셜 프로바이더로 가입됐는지 확인
        try {
          const res = await api.post<{ provider: string | null }>('/api/check-email-provider', {
            email,
          })
          const { provider } = res.data
          if (provider === 'kakao') return setServerError(t('duplicateAccountKakao'))
          if (provider === 'google') return setServerError(t('duplicateAccountGoogle'))
        } catch {
          // 확인 실패 시 generic 메시지
        }
        return setServerError(t('emailAlreadyRegistered'))
      }
      return setServerError(error.message)
    }
    // Confirm email OFF: 세션 즉시 발급 → 온보딩으로 이동
    if (data.session) {
      router.replace(`/${locale}/onboarding`)
      return
    }
    // Confirm email ON: 인증메일 발송됨
    onVerificationSent(email)
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

          {serverError && <span className="text-error text-[13px]">{serverError}</span>}
        </div>

        <div className="mt-auto pt-8">
          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? t('processing') : t('signupAction')}
          </Button>
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

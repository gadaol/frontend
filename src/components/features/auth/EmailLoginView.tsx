'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import PageLoading from '@/components/ui/PageLoading'

type FormValues = { email: string; password: string }

interface Props {
  onBack: () => void
  onSignUp: () => void
  onVerificationSent: (email: string) => void
}

export default function EmailLoginView({ onBack, onSignUp, onVerificationSent }: Props) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const router = useRouter()
  const supabase = createClient()
  const locale = useLocale()
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = z.object({
    email: z.string().email(t('emailError')),
    password: z.string().min(6, t('passwordError')),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? location.origin}/${locale}/auth/callback`,
          },
        })
        if (!resendError) {
          onVerificationSent(email)
          return
        }
      }
      return setServerError(t('invalidCredentials'))
    }
    router.push(`/${locale}/home`)
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
        <span className="text-ink text-[17px] font-semibold">{t('emailLogin')}</span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col px-5 py-6"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-ink text-[13px] font-medium">{t('emailLabel')}</label>
            <input
              {...register('email')}
              type="email"
              placeholder="hello@gadaol.com"
              className={`text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] outline-none focus:ring-2 ${errors.email ? 'border-error' : 'border-border'}`}
            />
            {errors.email && <span className="text-error text-[12px]">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-ink text-[13px] font-medium">{t('passwordLabel')}</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className={`text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] outline-none focus:ring-2 ${errors.password ? 'border-error' : 'border-border'}`}
            />
            {errors.password && (
              <span className="text-error text-[12px]">{errors.password.message}</span>
            )}
          </div>

          {serverError && <span className="text-error text-[13px]">{serverError}</span>}
        </div>

        <div className="mt-auto pt-8">
          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? t('processing') : t('loginAction')}
          </Button>
          <p className="text-ink3 mt-4 text-center text-[14px]">
            {t('noAccount')}{' '}
            <button type="button" onClick={onSignUp} className="text-primary font-medium">
              {t('signupAction')}
            </button>
          </p>
        </div>
      </form>
      <PageLoading visible={isSubmitting} />
    </div>
  )
}

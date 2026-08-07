'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'

type FormValues = { password: string; confirmPassword: string }

export default function ResetPasswordPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()
  const supabase = createClient()
  const [ready, setReady] = useState(false)
  const [expired, setExpired] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let becameReady = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        becameReady = true
        setReady(true)
        setExpired(false)
      }
    })

    // PKCE 흐름: 콜백에서 교환 완료 후 세션이 이미 있는 경우
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session) {
        becameReady = true
        setReady(true)
      } else {
        // hash 처리 후 PASSWORD_RECOVERY 이벤트를 기다림 (최대 2초)
        setTimeout(() => {
          if (mounted && !becameReady) setExpired(true)
        }, 2000)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const schema = z
    .object({
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

  const onSubmit = async ({ password }: FormValues) => {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return setServerError(error.message)
    await fetch('/api/clear-reset-cookie', { method: 'POST' })
    await supabase.auth.signOut()
    router.replace(`/${locale}`)
  }

  if (expired) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-white px-8 text-center">
        <p className="text-ink text-[15px] font-medium">{t('resetLinkExpired')}</p>
        <button
          onClick={() => router.push(`/${locale}`)}
          className="text-primary text-[14px] font-medium"
        >
          {t('backToLogin')}
        </button>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white">
        <p className="text-ink3 text-[14px]">{t('processing')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-white">
      <div className="border-border flex h-14 flex-shrink-0 items-center border-b px-4">
        <span className="text-ink text-[17px] font-semibold">{t('resetPasswordTitle')}</span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col overflow-y-auto px-5 py-6"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-ink text-[13px] font-medium">{t('newPasswordLabel')}</label>
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

          <div className="flex flex-col gap-1.5">
            <label className="text-ink text-[13px] font-medium">
              {t('confirmNewPasswordLabel')}
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              className={`text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] outline-none focus:ring-2 ${errors.confirmPassword ? 'border-error' : 'border-border'}`}
            />
            {errors.confirmPassword && (
              <span className="text-error text-[12px]">{errors.confirmPassword.message}</span>
            )}
          </div>

          {serverError && <span className="text-error text-[13px]">{serverError}</span>}
        </div>

        <div className="mt-auto pt-8">
          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? t('processing') : t('resetPasswordAction')}
          </Button>
        </div>
      </form>
    </div>
  )
}

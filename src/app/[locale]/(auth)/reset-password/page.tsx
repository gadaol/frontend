'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

type FormValues = { password: string; confirmPassword: string }

export default function ResetPasswordPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [ready, setReady] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) setReady(true)
      })
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        setReady(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
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
    await supabase.auth.signOut()
    setSuccess(true)
    setTimeout(() => router.push(`/${locale}`), 2000)
  }

  if (success) {
    return (
      <div className="flex h-full items-center justify-center bg-white px-8 text-center">
        <p className="text-[16px] font-medium text-[#1B6FF0]">{t('resetPasswordSuccess')}</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <p className="text-[14px] text-[#9099A8]">{t('processing')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 flex-shrink-0 items-center border-b border-[#E8EAED] px-4">
        <span className="text-[17px] font-semibold text-[#0F1117]">{t('resetPasswordTitle')}</span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col overflow-y-auto px-5 py-6"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#0F1117]">
              {t('newPasswordLabel')}
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className={`h-12 rounded-xl border px-3.5 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10 ${errors.password ? 'border-[#F04438]' : 'border-[#E8EAED]'}`}
            />
            {errors.password && (
              <span className="text-[12px] text-[#F04438]">{errors.password.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#0F1117]">
              {t('confirmNewPasswordLabel')}
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              className={`h-12 rounded-xl border px-3.5 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10 ${errors.confirmPassword ? 'border-[#F04438]' : 'border-[#E8EAED]'}`}
            />
            {errors.confirmPassword && (
              <span className="text-[12px] text-[#F04438]">{errors.confirmPassword.message}</span>
            )}
          </div>

          {serverError && <span className="text-[13px] text-[#F04438]">{serverError}</span>}
        </div>

        <div className="mt-auto pt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? t('processing') : t('resetPasswordAction')}
          </button>
        </div>
      </form>
    </div>
  )
}

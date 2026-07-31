'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 해요'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onBack: () => void
}

export default function EmailLoginView({ onBack }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const locale = useLocale()
  const [isSignUp, setIsSignUp] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) return setServerError(error.message)
      router.push(`/${locale}/onboarding`)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return setServerError('이메일 또는 비밀번호가 올바르지 않아요')
      router.push(`/${locale}/home`)
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="flex h-14 flex-shrink-0 items-center gap-1 border-b border-[#E8EAED] px-4">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center"
          aria-label="뒤로"
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
          {isSignUp ? '회원가입' : '이메일 로그인'}
        </span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col overflow-y-auto px-5 py-6"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#0F1117]">이메일</label>
            <input
              {...register('email')}
              type="email"
              placeholder="hello@gadaol.com"
              className={`h-12 rounded-xl border px-3.5 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10 ${errors.email ? 'border-[#F04438]' : 'border-[#E8EAED]'}`}
            />
            {errors.email && (
              <span className="text-[12px] text-[#F04438]">{errors.email.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#0F1117]">비밀번호</label>
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

          {!isSignUp && (
            <a href="#" className="self-end text-[13px] font-medium text-[#1B6FF0]">
              비밀번호를 잊으셨나요?
            </a>
          )}

          {serverError && <span className="text-[13px] text-[#F04438]">{serverError}</span>}
        </div>

        <div className="mt-auto pt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
          </button>
          <p className="mt-4 text-center text-[14px] text-[#9099A8]">
            {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-[#1B6FF0]"
            >
              {isSignUp ? '로그인' : '회원가입'}
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}

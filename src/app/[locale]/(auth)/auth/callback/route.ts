import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const next = searchParams.get('next')
      if (next === 'reset-password') {
        return NextResponse.redirect(`${origin}/${locale}/reset-password`)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const provider = user.app_metadata?.provider ?? ''
        const isSocialLogin = ['kakao', 'google'].includes(provider)

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, phone')
          .eq('id', user.id)
          .single()

        if (isSocialLogin && !profile?.phone) {
          return NextResponse.redirect(`${origin}/${locale}/phone-verify`)
        }

        // 이메일 회원가입 인증 완료 시 확인 화면
        if (provider === 'email' && !profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/${locale}/email-verified`)
        }

        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/${locale}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}/${locale}/home`)
    }
  }

  return NextResponse.redirect(`${origin}/${locale}?error=auth`)
}

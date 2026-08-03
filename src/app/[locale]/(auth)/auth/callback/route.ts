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
        const isSocialLogin = ['kakao', 'google'].includes(user.app_metadata?.provider ?? '')

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, phone')
          .eq('id', user.id)
          .single()

        if (isSocialLogin) {
          const createdAt = new Date(user.created_at)
          const secondsSinceCreation = (Date.now() - createdAt.getTime()) / 1000
          const isNewUser = secondsSinceCreation < 60

          if (isNewUser) {
            return NextResponse.redirect(`${origin}/${locale}/terms-agree`)
          }

          if (!profile?.phone) {
            return NextResponse.redirect(`${origin}/${locale}/phone-verify`)
          }
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

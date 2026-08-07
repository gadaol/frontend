import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 비밀번호 재설정 흐름: 재설정 완료 전까지 앱 진입 차단 쿠키 설정
      const next = searchParams.get('next')
      if (next === 'reset-password') {
        const res = NextResponse.redirect(`${origin}/${locale}/reset-password`)
        res.cookies.set('pwd_reset_pending', '1', {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 900, // 15분
        })
        return res
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const provider = user.app_metadata?.provider ?? ''

        // Social login: check if the email is already registered under a different provider
        if (provider !== 'email' && user.email) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: existingProvider } = await (supabase as any).rpc('email_already_in_use', {
            check_email: user.email,
            exclude_user_id: user.id,
          })

          if (existingProvider) {
            // Delete the orphan social user and redirect with error
            const admin = createAdminClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
            )
            await admin.auth.admin.deleteUser(user.id)
            await supabase.auth.signOut()
            return NextResponse.redirect(
              `${origin}/${locale}?error=email_exists&provider=${existingProvider}`,
            )
          }
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (provider === 'email' && !profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/${locale}/email-verified`)
        }

        const redirectTo = searchParams.get('redirect_to')

        if (!profile?.onboarding_completed) {
          const onboardingUrl = redirectTo
            ? `${origin}/${locale}/onboarding?redirect_to=${encodeURIComponent(redirectTo)}`
            : `${origin}/${locale}/onboarding`
          return NextResponse.redirect(onboardingUrl)
        }

        if (redirectTo?.startsWith('/')) {
          return NextResponse.redirect(`${origin}${redirectTo}`)
        }
      }

      return NextResponse.redirect(`${origin}/${locale}/home`)
    }
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(`${origin}/${locale}?error=auth`)
}

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

        // 소셜 로그인: account_links 체크 (연동된 보조 계정인지 확인)
        if (isSocialLogin) {
          const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
          )
          const { data: link } = await adminClient
            .from('account_links')
            .select('primary_user_id, linked_provider')
            .eq('linked_user_id', user.id)
            .maybeSingle()

          if (link) {
            const { data: primaryUserData } = await adminClient.auth.admin.getUserById(
              link.primary_user_id,
            )
            const primaryProvider = primaryUserData?.user?.app_metadata?.provider ?? 'email'
            await supabase.auth.signOut()
            return NextResponse.redirect(
              `${origin}/${locale}?error=use_primary_account&provider=${primaryProvider}`,
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

        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/${locale}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}/${locale}/home`)
    }
  }

  return NextResponse.redirect(`${origin}/${locale}?error=auth`)
}

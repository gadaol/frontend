import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database/database.types'

export async function updateSession(request: NextRequest, response?: NextResponse) {
  let supabaseResponse = response ?? NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // locale prefix 제거 후 pathname 체크 (/ko/home → /home)
  const pathname = request.nextUrl.pathname.replace(/^\/(ko|en)/, '') || '/'
  const locale = request.nextUrl.pathname.match(/^\/(ko|en)/)?.[1] ?? 'ko'

  const protectedPaths = [
    '/home',
    '/trips',
    '/places',
    '/backlog',
    '/mypage',
    '/notifications',
    '/onboarding',
  ]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
  const isOnboarding = pathname.startsWith('/onboarding')
  const isAuthRoute = pathname === '/'

  // 비밀번호 재설정 중인 세션: 재설정 완료 전까지 앱 진입 차단
  const pwdResetPending = request.cookies.get('pwd_reset_pending')?.value
  if (user && pwdResetPending && !pathname.startsWith('/reset-password')) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/reset-password`
    return NextResponse.redirect(url)
  }

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}`
    return NextResponse.redirect(url)
  }

  if (user && isProtected && !isOnboarding) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_completed) {
      const url = request.nextUrl.clone()
      url.pathname = `/${locale}/onboarding`
      return NextResponse.redirect(url)
    }
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/home`
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

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

  const protectedPaths = ['/home', '/trips', '/places', '/backlog', '/mypage', '/notifications']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
  const isAuthRoute = pathname === '/' || pathname === '/onboarding'

  // 소셜 로그인 유저 전화번호 미인증 체크
  if (user && pathname !== '/phone-verify') {
    const isSocialLogin = ['kakao', 'google'].includes(user.app_metadata?.provider ?? '')
    if (isSocialLogin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single()

      if (!profile?.phone) {
        const url = request.nextUrl.clone()
        url.pathname = `/${locale}/phone-verify`
        return NextResponse.redirect(url)
      }
    }
  }

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = url.pathname.replace(/\/(home|trips|places|backlog|mypage|notifications).*/, '/')
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/home`
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

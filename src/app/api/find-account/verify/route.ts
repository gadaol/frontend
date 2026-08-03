import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { toE164, verifyOtp } from '@/lib/otp'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  const masked = local.slice(0, 2) + '*'.repeat(Math.max(local.length - 2, 1))
  return `${masked}@${domain}`
}

export async function POST(request: Request) {
  const { phone, code } = await request.json()

  if (!phone || !code) {
    return NextResponse.json({ error: 'phone and code required' }, { status: 400 })
  }

  const { error } = await verifyOtp(phone, code)
  if (error) return error

  const e164 = toE164(phone)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profiles, error: dbError } = await supabase
    .from('profiles')
    .select('id, phone')
    .or(`phone.eq.${phone},phone.eq.${e164}`)
    .limit(1)

  if (dbError || !profiles || profiles.length === 0) {
    return NextResponse.json({ found: false })
  }

  const { data: userData } = await supabase.auth.admin.getUserById(profiles[0].id)

  if (!userData?.user) {
    return NextResponse.json({ found: false })
  }

  const { email, app_metadata } = userData.user
  const providers: string[] = app_metadata?.providers ?? [app_metadata?.provider ?? 'email']

  return NextResponse.json({
    found: true,
    maskedEmail: email ? maskEmail(email) : null,
    providers,
  })
}

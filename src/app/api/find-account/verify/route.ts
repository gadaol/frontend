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

  const phoneRaw = phone.replace(/-/g, '')
  const e164 = toE164(phone)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profiles, error: dbError } = await supabase
    .from('profiles')
    .select('id, phone')
    .or(`phone.eq.${phone},phone.eq.${phoneRaw},phone.eq.${e164}`)

  if (dbError || !profiles || profiles.length === 0) {
    return NextResponse.json({ found: false })
  }

  const accounts = (
    await Promise.all(
      profiles.map(async (p) => {
        const { data } = await supabase.auth.admin.getUserById(p.id)
        if (!data?.user) return null
        const { email, app_metadata } = data.user
        const providers: string[] = app_metadata?.providers ?? [app_metadata?.provider ?? 'email']
        return { maskedEmail: email ? maskEmail(email) : null, providers }
      }),
    )
  ).filter(Boolean)

  if (accounts.length === 0) return NextResponse.json({ found: false })

  return NextResponse.json({ found: true, accounts })
}

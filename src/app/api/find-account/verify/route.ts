import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '+82' + digits.slice(1)
  return '+' + digits
}

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

  const e164 = toE164(phone)

  if (process.env.NODE_ENV !== 'development') {
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    let verification
    try {
      verification = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verificationChecks.create({ to: e164, code })
    } catch {
      return NextResponse.json({ error: '인증에 실패했어요' }, { status: 400 })
    }
    if (verification.status !== 'approved') {
      return NextResponse.json({ error: '인증번호가 올바르지 않아요' }, { status: 400 })
    }
  } else if (code !== '000000') {
    return NextResponse.json({ error: '인증번호가 올바르지 않아요' }, { status: 400 })
  }

  // profiles에서 전화번호로 user_id 조회
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, phone')
    .or(`phone.eq.${phone},phone.eq.${e164}`)
    .limit(1)

  if (error || !profiles || profiles.length === 0) {
    return NextResponse.json({ found: false })
  }

  const userId = profiles[0].id

  // auth.users에서 이메일 및 provider 조회
  const { data: userData } = await supabase.auth.admin.getUserById(userId)

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

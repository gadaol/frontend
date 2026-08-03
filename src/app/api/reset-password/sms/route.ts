import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '+82' + digits.slice(1)
  return '+' + digits
}

export async function POST(request: Request) {
  const { phone, code, newPassword } = await request.json()

  if (!phone || !code || !newPassword) {
    return NextResponse.json({ error: 'phone, code, newPassword required' }, { status: 400 })
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .or(`phone.eq.${phone},phone.eq.${e164}`)
    .limit(1)

  if (profileError || !profiles || profiles.length === 0) {
    return NextResponse.json({ error: '등록된 계정을 찾을 수 없어요' }, { status: 404 })
  }

  const userId = profiles[0].id

  const { data: userData } = await supabase.auth.admin.getUserById(userId)
  const email = userData?.user?.email

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json({ error: '비밀번호 변경에 실패했어요' }, { status: 500 })
  }

  return NextResponse.json({ success: true, email })
}

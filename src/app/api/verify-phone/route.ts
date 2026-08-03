import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '+82' + digits.slice(1)
  return '+' + digits
}

export async function POST(request: Request) {
  const { phone, code } = await request.json()

  if (!phone || !code) {
    return NextResponse.json({ error: 'phone and code required' }, { status: 400 })
  }

  if (process.env.NODE_ENV !== 'development') {
    const e164 = toE164(phone)
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    try {
      const verification = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verificationChecks.create({ to: e164, code })

      if (verification.status !== 'approved') {
        return NextResponse.json({ error: '인증번호가 올바르지 않아요' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: '인증에 실패했어요' }, { status: 400 })
    }
  } else if (code !== '000000') {
    return NextResponse.json({ error: '인증번호가 올바르지 않아요' }, { status: 400 })
  }

  // 전화번호 중복 체크
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: '이미 해당 전화번호로 가입된 계정이 있어요' },
      { status: 409 },
    )
  }

  return NextResponse.json({ success: true })
}

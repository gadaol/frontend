import { NextResponse } from 'next/server'
import twilio from 'twilio'

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '+82' + digits.slice(1)
  return '+' + digits
}

export async function POST(request: Request) {
  const { phone } = await request.json()

  if (!phone) {
    return NextResponse.json({ error: 'phone required' }, { status: 400 })
  }

  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({ success: true })
  }

  const e164 = toE164(phone)
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

  try {
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to: e164, channel: 'sms' })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[find-account/send]', err)
    return NextResponse.json({ error: 'SMS 발송에 실패했어요' }, { status: 500 })
  }
}

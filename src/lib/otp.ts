import twilio from 'twilio'
import { NextResponse } from 'next/server'

export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '+82' + digits.slice(1)
  return '+' + digits
}

export async function sendOtp(phone: string): Promise<{ error?: NextResponse }> {
  if (process.env.NODE_ENV === 'development') return {}

  const e164 = toE164(phone)
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  try {
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to: e164, channel: 'sms' })
    return {}
  } catch {
    return { error: NextResponse.json({ error: 'SMS 발송에 실패했어요' }, { status: 500 }) }
  }
}

export async function verifyOtp(phone: string, code: string): Promise<{ error?: NextResponse }> {
  if (process.env.NODE_ENV === 'development') {
    if (code !== '000000') {
      return { error: NextResponse.json({ error: '인증번호가 올바르지 않아요' }, { status: 400 }) }
    }
    return {}
  }

  const e164 = toE164(phone)
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  try {
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: e164, code })
    if (result.status !== 'approved') {
      return { error: NextResponse.json({ error: '인증번호가 올바르지 않아요' }, { status: 400 }) }
    }
    return {}
  } catch {
    return { error: NextResponse.json({ error: '인증에 실패했어요' }, { status: 400 }) }
  }
}

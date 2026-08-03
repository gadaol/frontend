import { NextResponse } from 'next/server'
import { sendOtp } from '@/lib/otp'

export async function POST(request: Request) {
  const { phone } = await request.json()

  if (!phone) {
    return NextResponse.json({ error: 'phone required' }, { status: 400 })
  }

  const { error } = await sendOtp(phone)
  if (error) return error

  return NextResponse.json({ success: true })
}

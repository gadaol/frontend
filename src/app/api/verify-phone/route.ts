import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyOtp } from '@/lib/otp'

export async function POST(request: Request) {
  const { phone, code } = await request.json()

  if (!phone || !code) {
    return NextResponse.json({ error: 'phone and code required' }, { status: 400 })
  }

  const { error } = await verifyOtp(phone, code)
  if (error) return error

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

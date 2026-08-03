import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyOtp } from '@/lib/otp'

export async function POST(request: Request) {
  const { phone, code } = await request.json()

  if (!phone || !code) {
    return NextResponse.json({ error: 'phone and code required' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 })
  }

  const { error } = await verifyOtp(phone, code)
  if (error) return error

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .neq('id', user.id)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: '이미 해당 전화번호로 가입된 계정이 있어요' },
      { status: 409 },
    )
  }

  const { error: updateError } = await supabase.from('profiles').upsert({ id: user.id, phone })

  if (updateError) {
    return NextResponse.json({ error: '저장에 실패했어요' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

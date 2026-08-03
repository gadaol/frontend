import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { toE164, verifyOtp } from '@/lib/otp'

export async function POST(request: Request) {
  const { phone, code, newPassword } = await request.json()

  if (!phone || !code || !newPassword) {
    return NextResponse.json({ error: 'phone, code, newPassword required' }, { status: 400 })
  }

  const { error } = await verifyOtp(phone, code)
  if (error) return error

  const e164 = toE164(phone)
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
    return NextResponse.json({ errorCode: 'accountNotFound' }, { status: 404 })
  }

  const { data: userData } = await supabase.auth.admin.getUserById(profiles[0].id)
  const email = userData?.user?.email

  const { error: updateError } = await supabase.auth.admin.updateUserById(profiles[0].id, {
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json({ errorCode: 'passwordUpdateFailed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, email })
}

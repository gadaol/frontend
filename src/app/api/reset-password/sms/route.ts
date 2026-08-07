import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { toE164 } from '@/lib/otp'

export async function POST(request: Request) {
  const { phone, email, newPassword } = await request.json()

  if (!phone || !email || !newPassword) {
    return NextResponse.json({ error: 'phone, email, newPassword required' }, { status: 400 })
  }

  const phoneRaw = phone.replace(/-/g, '')
  const e164 = toE164(phone)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 전화번호로 프로필 조회 후 이메일 일치하는 계정 찾기
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .or(`phone.eq.${phone},phone.eq.${phoneRaw},phone.eq.${e164}`)

  if (profileError || !profiles || profiles.length === 0) {
    return NextResponse.json({ errorCode: 'accountNotFound' }, { status: 404 })
  }

  const targetUser = (
    await Promise.all(
      profiles.map(async (p) => {
        const { data } = await supabase.auth.admin.getUserById(p.id)
        const u = data?.user
        if (!u) return null
        if (u.email !== email) return null
        if (u.app_metadata?.provider !== 'email') return null
        return u
      }),
    )
  ).find(Boolean)

  if (!targetUser) {
    return NextResponse.json({ errorCode: 'accountNotFound' }, { status: 404 })
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(targetUser.id, {
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json({ errorCode: 'passwordUpdateFailed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

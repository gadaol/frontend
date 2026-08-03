import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '****'
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4)
}

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    return NextResponse.json({ error: '조회에 실패했어요' }, { status: 500 })
  }

  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (!user) {
    return NextResponse.json({ found: false })
  }

  const providers: string[] = user.app_metadata?.providers ?? [user.app_metadata?.provider ?? 'email']

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    found: true,
    maskedPhone: profile?.phone ? maskPhone(profile.phone) : null,
    providers,
  })
}

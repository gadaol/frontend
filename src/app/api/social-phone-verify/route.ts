import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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
    return NextResponse.json({ errorCode: 'authRequired' }, { status: 401 })
  }

  const { error } = await verifyOtp(phone, code)
  if (error) return error

  const { error: updateError } = await supabase.from('profiles').upsert({ id: user.id, phone })

  if (updateError) {
    return NextResponse.json({ errorCode: 'saveFailed' }, { status: 500 })
  }

  // 전화번호 기준 1회만 Pro 체험 지급
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: existingGrant } = await adminSupabase
    .from('phone_trial_grants')
    .select('phone')
    .eq('phone', phone)
    .maybeSingle()

  let trialGranted = false
  if (!existingGrant) {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    const { error: subError } = await adminSupabase.from('subscriptions').insert({
      user_id: user.id,
      plan: 'pro',
      status: 'active',
      expires_at: expiresAt.toISOString(),
    })

    if (!subError) {
      const { error: grantError } = await adminSupabase.from('phone_trial_grants').insert({ phone })
      if (!grantError) trialGranted = true
    }
  }

  return NextResponse.json({ success: true, trialGranted })
}

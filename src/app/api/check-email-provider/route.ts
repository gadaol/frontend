import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ errorCode: 'invalidRequest' }, { status: 400 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data } = await adminClient.auth.admin.listUsers()
  const user = data.users.find((u) => u.email === email)
  if (!user) return NextResponse.json({ provider: null })

  const provider = user.app_metadata?.provider ?? 'email'
  return NextResponse.json({ provider })
}

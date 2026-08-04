import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { primaryUserId } = await request.json()

  if (!primaryUserId) {
    return NextResponse.json({ errorCode: 'saveFailed' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ errorCode: 'authRequired' }, { status: 401 })
  }

  const linkedProvider = user.app_metadata?.provider ?? 'email'

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: primaryUserData } = await adminClient.auth.admin.getUserById(primaryUserId)
  if (!primaryUserData?.user) {
    return NextResponse.json({ errorCode: 'accountNotFound' }, { status: 404 })
  }

  const { error } = await adminClient
    .from('account_links')
    .upsert(
      { primary_user_id: primaryUserId, linked_user_id: user.id, linked_provider: linkedProvider },
      { onConflict: 'linked_user_id' },
    )

  if (error) {
    return NextResponse.json({ errorCode: 'saveFailed' }, { status: 500 })
  }

  await supabase.auth.signOut()

  const primaryProvider = primaryUserData.user.app_metadata?.provider ?? 'email'
  return NextResponse.json({ success: true, primaryProvider })
}

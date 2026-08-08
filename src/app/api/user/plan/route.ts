import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/planGate'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const plan = await getUserPlan(supabase, user.id)
  return NextResponse.json({ plan })
}

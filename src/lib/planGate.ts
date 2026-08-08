import type { SupabaseClient } from '@supabase/supabase-js'
import type { Plan } from '@/utils/plans'

const PLAN_LEVEL: Record<Plan, number> = { free: 0, pro: 1, plus: 2 }

export function canAccess(userPlan: Plan, required: Plan): boolean {
  return PLAN_LEVEL[userPlan] >= PLAN_LEVEL[required]
}

export async function getUserPlan(supabase: SupabaseClient, userId: string): Promise<Plan> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .in('status', ['active', 'trial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data?.plan as Plan) ?? 'free'
}

export function planGateResponse(required: Plan): Response {
  return new Response(JSON.stringify({ error: 'plan_required', required }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** 각 기능별 최소 플랜 */
export const FEATURE_PLAN = {
  voice: 'plus',
  itinerary: 'plus',
  collection: 'pro',
  invite: 'pro',
  expense: 'pro',
  multiDestination: 'pro',
  characterRog: 'pro',
  aiSearch: 'pro',
  aiDestinations: 'pro',
} as const satisfies Record<string, Plan>

export const FREE_TRIP_LIMIT = 3

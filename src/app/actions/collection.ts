'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, canAccess, FEATURE_PLAN } from '@/lib/planGate'

export type BacklogCollection = {
  id: string
  name: string
  order_index: number
}

export async function getCollections(): Promise<BacklogCollection[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('backlog_collections')
    .select('id, name, order_index')
    .eq('user_id', user.id)
    .order('order_index')

  return data ?? []
}

export async function createCollection(name: string): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const plan = await getUserPlan(supabase, user.id)
  if (!canAccess(plan, FEATURE_PLAN.collection)) return { error: 'plan_required' }

  const { data: existing } = await supabase
    .from('backlog_collections')
    .select('order_index')
    .eq('user_id', user.id)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (existing?.order_index ?? -1) + 1

  const { data, error } = await supabase
    .from('backlog_collections')
    .insert({ user_id: user.id, name: name.trim(), order_index: nextOrder })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/[locale]/(main)/(tabs)/backlog', 'page')
  return { id: data.id }
}

export async function renameCollection(id: string, name: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('backlog_collections')
    .update({ name: name.trim() })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/[locale]/(main)/(tabs)/backlog', 'page')
}

export async function deleteCollection(id: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // items의 collection_id는 ON DELETE SET NULL으로 자동 해제
  await supabase.from('backlog_collections').delete().eq('id', id).eq('user_id', user.id)

  revalidatePath('/[locale]/(main)/(tabs)/backlog', 'page')
}

export async function moveItemToCollection(
  itemId: string,
  collectionId: string | null,
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('backlog_items')
    .update({ collection_id: collectionId })
    .eq('id', itemId)
    .eq('user_id', user.id)
}

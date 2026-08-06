'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export async function updateName(name: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const trimmed = name.trim()
  if (!trimmed) return { error: 'empty' }

  const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const locale = await getLocale()
  redirect(`/${locale}`)
}

export async function deleteAccount() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase.from('profiles').delete().eq('id', user.id)
  if (error) return { error: error.message }

  await supabase.auth.signOut()
  const locale = await getLocale()
  redirect(`/${locale}`)
}

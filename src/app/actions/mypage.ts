'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export async function deleteAvatar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const exts = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  await Promise.all(
    exts.map((ext) => supabase.storage.from('avatars').remove([`${user.id}/avatar.${ext}`])),
  )

  const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'no_file' }
  if (file.size > 5 * 1024 * 1024) return { error: 'too_large' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/', 'layout')
  return { avatarUrl }
}

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

export async function updateTravelStyle({
  travel_companion,
  travel_pace,
  travel_places,
}: {
  travel_companion: string[]
  travel_pace: string[]
  travel_places: string[]
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({ travel_companion, travel_pace, travel_places })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
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

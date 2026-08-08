'use server'

import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AddToBacklogInput = {
  googlePlaceId: string
  name: string
  address: string | null
  categoryName: string | null
  lat?: number | null
  lng?: number | null
  photoRef?: string | null
}

/** places 테이블에서 조회하거나 없으면 생성 후 place ID 반환 */
export async function getOrCreatePlace(input: AddToBacklogInput): Promise<string | null> {
  const supabase = await createClient()

  let categoryId: string | null = null
  const koName = input.categoryName && input.categoryName !== '기타' ? input.categoryName : null
  if (koName) {
    const { data: cat } = await supabase
      .from('place_categories')
      .select('id')
      .eq('name', koName)
      .single()
    categoryId = cat?.id ?? null
  }

  const { data: existing } = await supabase
    .from('places')
    .select('id, category_id, lat, photo_ref')
    .eq('google_place_id', input.googlePlaceId)
    .single()

  if (existing) {
    const updates: { category_id?: string; lat?: number; lng?: number; photo_ref?: string } = {}
    if (!existing.category_id && categoryId) updates.category_id = categoryId
    if (!existing.lat && input.lat) {
      updates.lat = input.lat
      updates.lng = input.lng ?? undefined
    }
    if (!existing.photo_ref && input.photoRef) updates.photo_ref = input.photoRef
    if (Object.keys(updates).length > 0) {
      await supabase.from('places').update(updates).eq('id', existing.id)
    }
    return existing.id
  }

  const { data: newPlace } = await supabase
    .from('places')
    .insert({
      google_place_id: input.googlePlaceId,
      name: input.name,
      address: input.address,
      category_id: categoryId,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      photo_ref: input.photoRef ?? null,
    })
    .select('id')
    .single()

  return newPlace?.id ?? null
}

export async function addToBacklog(input: AddToBacklogInput) {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const placeId = await getOrCreatePlace(input)
  if (!placeId) return { error: 'place_insert_failed' }

  const { data: existingItem } = await supabase
    .from('backlog_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('place_id', placeId)
    .single()

  if (existingItem) return { alreadyExists: true, id: existingItem.id }

  const { data: item, error } = await supabase
    .from('backlog_items')
    .insert({ user_id: user.id, place_id: placeId })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { success: true, id: item.id }
}

export async function removeFromBacklog(backlogItemId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('backlog_items')
    .delete()
    .eq('id', backlogItemId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function removeFromBacklogByGooglePlaceId(googlePlaceId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: place } = await supabase
    .from('places')
    .select('id')
    .eq('google_place_id', googlePlaceId)
    .single()

  if (!place) return { error: 'place_not_found' }

  const { error } = await supabase
    .from('backlog_items')
    .delete()
    .eq('place_id', place.id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

'use server'

import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AddToBacklogInput = {
  googlePlaceId: string
  name: string
  address: string | null
  categoryName: string | null
}

const GOOGLE_TYPE_TO_CATEGORY: Record<string, string> = {
  restaurant: '식당',
  food: '식당',
  meal_takeaway: '식당',
  meal_delivery: '식당',
  cafe: '카페',
  bakery: '카페',
  coffee: '카페',
  lodging: '숙소',
  hotel: '숙소',
  motel: '숙소',
  tourist_attraction: '관광지',
  museum: '관광지',
  art_gallery: '관광지',
  amusement_park: '관광지',
  shopping_mall: '쇼핑',
  store: '쇼핑',
  clothing_store: '쇼핑',
  department_store: '쇼핑',
  park: '자연',
  natural_feature: '자연',
  campground: '자연',
}

/** places 테이블에서 조회하거나 없으면 생성 후 place ID 반환 */
export async function getOrCreatePlace(input: AddToBacklogInput): Promise<string | null> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('places')
    .select('id')
    .eq('google_place_id', input.googlePlaceId)
    .single()

  if (existing) return existing.id

  let categoryId: string | null = null
  const koName = input.categoryName ? GOOGLE_TYPE_TO_CATEGORY[input.categoryName] : null
  if (koName) {
    const { data: cat } = await supabase
      .from('place_categories')
      .select('id')
      .eq('name', koName)
      .single()
    categoryId = cat?.id ?? null
  }

  const { data: newPlace } = await supabase
    .from('places')
    .insert({
      google_place_id: input.googlePlaceId,
      name: input.name,
      address: input.address,
      category_id: categoryId,
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

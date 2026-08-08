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

export async function addRecommendedPlaceToBacklog({
  googleSearchQuery,
  fallbackName,
  category,
}: {
  googleSearchQuery: string
  fallbackName: string
  category: string
}): Promise<{ success?: boolean; alreadyExists?: boolean; error?: string }> {
  const { searchPlacesText } = await import('@/lib/googlePlaces')
  const places = await searchPlacesText(googleSearchQuery)
  if (!places || places.length === 0) return { error: 'place_not_found' }

  const place = places[0]
  return addToBacklog({
    googlePlaceId: place.id,
    name: place.displayName.text,
    address: place.formattedAddress ?? null,
    categoryName: category || null,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
  })
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

export async function getUserActiveTrips(): Promise<
  { id: string; title: string; destination: string | null; start_date: string | null }[]
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('trips')
    .select('id, title, destination, start_date')
    .eq('owner_id', user.id)
    .in('status', ['planning', 'ongoing'])
    .order('start_date', { ascending: true })
    .limit(10)

  return data ?? []
}

export async function addRecommendedPlaceToTrip({
  googleSearchQuery,
  fallbackName,
  category,
  tripId,
  tripStartDate,
}: {
  googleSearchQuery: string
  fallbackName: string
  category: string
  tripId: string
  tripStartDate: string | null
}): Promise<{ success?: boolean; error?: string }> {
  const { searchPlacesText } = await import('@/lib/googlePlaces')
  const places = await searchPlacesText(googleSearchQuery)
  if (!places || places.length === 0) return { error: 'place_not_found' }

  const place = places[0]
  const placeId = await getOrCreatePlace({
    googlePlaceId: place.id,
    name: place.displayName.text,
    address: place.formattedAddress ?? null,
    categoryName: category || null,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
  })
  if (!placeId) return { error: 'place_create_failed' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: member } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!member) return { error: 'forbidden' }

  const dayDate = tripStartDate ?? new Date().toISOString().split('T')[0]

  // ensureItineraryDay 인라인
  const { data: existingDay } = await supabase
    .from('itinerary_days')
    .select('id')
    .eq('trip_id', tripId)
    .eq('day_number', 1)
    .maybeSingle()

  let dayId: string | null = existingDay?.id ?? null
  if (!dayId) {
    const { data: newDay } = await supabase
      .from('itinerary_days')
      .insert({ trip_id: tripId, day_date: dayDate, day_number: 1 })
      .select('id')
      .single()
    dayId = newDay?.id ?? null
  }
  if (!dayId) return { error: 'day_create_failed' }

  const { data: lastItem } = await supabase
    .from('itinerary_items')
    .select('order_index')
    .eq('day_id', dayId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (lastItem?.order_index ?? -1) + 1
  const { error } = await supabase
    .from('itinerary_items')
    .insert({ day_id: dayId, place_id: placeId, order_index: nextOrder })

  if (error) return { error: error.message }

  const locale = await getLocale()
  const { revalidatePath } = await import('next/cache')
  revalidatePath(`/${locale}/trips/${tripId}`)
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

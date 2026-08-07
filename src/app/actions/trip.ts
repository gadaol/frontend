'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export async function createTrip(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const title = (formData.get('title') as string).trim()
  const startDate = (formData.get('start_date') as string) || null
  const endDate = (formData.get('end_date') as string) || null
  const destination = (formData.get('destination') as string)?.trim() || null
  const coverUrl = (formData.get('cover_url') as string) || null
  const invitedIds = (formData.getAll('invited_user_ids') as string[]).filter(Boolean)

  if (!title) return { error: '여행 제목을 입력해주세요' }

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      title,
      destination,
      cover_url: coverUrl,
      start_date: startDate,
      end_date: endDate,
      owner_id: user.id,
    })
    .select('id')
    .single()

  if (error || !trip) {
    console.error('[createTrip] insert error:', error)
    return { error: error?.message ?? '여행 생성에 실패했어요' }
  }

  const membersToInsert = [
    { trip_id: trip.id, user_id: user.id, role: 'owner' },
    ...invitedIds.map((uid) => ({ trip_id: trip.id, user_id: uid, role: 'member' })),
  ]

  const { error: memberError } = await supabase.from('trip_members').insert(membersToInsert)

  if (memberError) {
    console.error('[createTrip] member insert error:', memberError)
  }

  redirect(`/${locale}/trips/${trip.id}`)
}

export async function ensureItineraryDay(
  tripId: string,
  dayDate: string,
  dayNumber: number,
): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: existing } = await supabase
    .from('itinerary_days')
    .select('id')
    .eq('trip_id', tripId)
    .eq('day_date', dayDate)
    .single()

  if (existing) return existing.id

  const { data: created } = await supabase
    .from('itinerary_days')
    .insert({ trip_id: tripId, day_date: dayDate, day_number: dayNumber })
    .select('id')
    .single()

  return created?.id ?? null
}

export async function addItineraryItem(
  tripId: string,
  dayDate: string,
  dayNumber: number,
  placeId: string,
): Promise<{ error?: string }> {
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

  const dayId = await ensureItineraryDay(tripId, dayDate, dayNumber)
  if (!dayId) return { error: 'day_create_failed' }

  const { data: existing } = await supabase
    .from('itinerary_items')
    .select('order_index')
    .eq('day_id', dayId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (existing?.order_index ?? -1) + 1

  const { error } = await supabase
    .from('itinerary_items')
    .insert({ day_id: dayId, place_id: placeId, order_index: nextOrder })

  if (error) return { error: error.message }

  const locale = await getLocale()
  revalidatePath(`/${locale}/trips/${tripId}`)
  return {}
}

export async function removeItineraryItem(itemId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  // item → day → trip 소유권 검증
  const { data: item } = await supabase
    .from('itinerary_items')
    .select('itinerary_days(trip_id)')
    .eq('id', itemId)
    .maybeSingle()

  const tripId = (item?.itinerary_days as { trip_id: string } | null)?.trip_id
  if (!tripId) return { error: 'not_found' }

  const { data: member } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return { error: 'forbidden' }

  const { error } = await supabase.from('itinerary_items').delete().eq('id', itemId)
  if (error) return { error: error.message }
  return {}
}

export async function updateItineraryItemTime(
  itemId: string,
  visitTime: string | null,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: item } = await supabase
    .from('itinerary_items')
    .select('itinerary_days(trip_id)')
    .eq('id', itemId)
    .maybeSingle()

  const tripId = (item?.itinerary_days as { trip_id: string } | null)?.trip_id
  if (!tripId) return { error: 'not_found' }

  const { data: member } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!member) return { error: 'forbidden' }

  const { error } = await supabase
    .from('itinerary_items')
    .update({ visit_time: visitTime || null })
    .eq('id', itemId)
  if (error) return { error: error.message }
  return {}
}

export async function reorderItineraryDay(
  dayId: string,
  orderedItemIds: string[],
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: day } = await supabase
    .from('itinerary_days')
    .select('trip_id')
    .eq('id', dayId)
    .maybeSingle()

  if (!day) return { error: 'not_found' }

  const { data: member } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', day.trip_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return { error: 'forbidden' }

  await Promise.all(
    orderedItemIds.map((itemId, index) =>
      supabase
        .from('itinerary_items')
        .update({ order_index: index })
        .eq('id', itemId)
        .eq('day_id', dayId),
    ),
  )

  const locale = await getLocale()
  revalidatePath(`/${locale}/trips/${day.trip_id}`)
  return {}
}

export async function deleteOutOfRangeDays(
  tripId: string,
  startDate: string,
  endDate: string,
): Promise<{ error?: string }> {
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

  // itinerary_items는 FK cascade로 자동 삭제됨
  const { error } = await supabase
    .from('itinerary_days')
    .delete()
    .eq('trip_id', tripId)
    .or(`day_date.lt.${startDate},day_date.gt.${endDate}`)

  if (error) return { error: error.message }
  return {}
}

export async function updateTrip(
  tripId: string,
  data: {
    title?: string
    destination?: string | null
    start_date?: string | null
    end_date?: string | null
    cover_url?: string | null
  },
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('trips')
    .update(data)
    .eq('id', tripId)
    .eq('owner_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return {}
}

export async function addMemoItem(
  tripId: string,
  dayDate: string,
  dayNumber: number,
  memo: string,
): Promise<{ error?: string }> {
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

  const dayId = await ensureItineraryDay(tripId, dayDate, dayNumber)
  if (!dayId) return { error: 'day_create_failed' }

  const { data: existing } = await supabase
    .from('itinerary_items')
    .select('order_index')
    .eq('day_id', dayId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (existing?.order_index ?? -1) + 1

  const { error } = await supabase.from('itinerary_items').insert({
    day_id: dayId,
    place_id: null,
    item_type: 'memo',
    memo: memo.trim() || null,
    order_index: nextOrder,
  })

  if (error) return { error: error.message }

  const locale = await getLocale()
  revalidatePath(`/${locale}/trips/${tripId}`)
  return {}
}

export async function updateItineraryItemMemo(
  itemId: string,
  memo: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: item } = await supabase
    .from('itinerary_items')
    .select('itinerary_days(trip_id)')
    .eq('id', itemId)
    .maybeSingle()

  const tripId = (item?.itinerary_days as { trip_id: string } | null)?.trip_id
  if (!tripId) return { error: 'not_found' }

  const { data: memberCheck } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!memberCheck) return { error: 'forbidden' }

  const { error } = await supabase
    .from('itinerary_items')
    .update({ memo: memo.trim() || null })
    .eq('id', itemId)

  if (error) return { error: error.message }
  return {}
}

export async function addExpense(data: {
  tripId: string
  dayId: string | null
  itemId: string | null
  amount: number
  category: string
  note?: string
}): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: member } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', data.tripId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return { error: 'forbidden' }

  const { data: inserted, error } = await supabase
    .from('trip_expenses')
    .insert({
      trip_id: data.tripId,
      day_id: data.dayId,
      item_id: data.itemId,
      amount: data.amount,
      category: data.category,
      note: data.note?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: inserted.id }
}

export async function removeExpense(expenseId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: expense } = await supabase
    .from('trip_expenses')
    .select('trip_id')
    .eq('id', expenseId)
    .maybeSingle()

  if (!expense) return { error: 'not_found' }

  const { data: member } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', expense.trip_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return { error: 'forbidden' }

  const { error } = await supabase.from('trip_expenses').delete().eq('id', expenseId)
  if (error) return { error: error.message }
  return {}
}

export async function kickMember(
  tripId: string,
  targetUserId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { data: trip } = await supabase
    .from('trips')
    .select('owner_id')
    .eq('id', tripId)
    .maybeSingle()

  if (trip?.owner_id !== user.id) return { error: 'forbidden' }
  if (targetUserId === user.id) return { error: 'cannot_kick_self' }

  const { error } = await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return {}
}

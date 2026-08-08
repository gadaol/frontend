'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { searchPlacesText } from '@/lib/googlePlaces'

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
  const startTime = (formData.get('start_time') as string) || null
  const endTime = (formData.get('end_time') as string) || null
  const invitedIds = (formData.getAll('invited_user_ids') as string[]).filter(Boolean)
  const destinationsRaw = (formData.get('destinations') as string) || null
  const destinations = destinationsRaw ? (() => { try { return JSON.parse(destinationsRaw) } catch { return null } })() : null

  if (!title) return { error: (await getTranslations('trips'))('titleRequired') }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trip, error } = await (supabase as any)
    .from('trips')
    .insert({
      title,
      destination,
      cover_url: coverUrl,
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
      owner_id: user.id,
      ...(destinations ? { destinations } : {}),
    })
    .select('id')
    .single()

  if (error || !trip) {
    console.error('[createTrip] insert error:', error)
    return { error: error?.message ?? (await getTranslations('trips'))('createFailed') }
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

export interface GeneratedItineraryItemInput {
  placeName: string
  category: string
  visitTime: string
  memo: string
  googleSearchQuery: string
  /** AI가 산출한 1인 예상 비용(원). 0이면 저장 안 함 */
  estimatedCostKrw?: number
  /** trip_expenses.category 값 (식비/카페/숙박/교통/입장료/쇼핑/기타) */
  costCategory?: string
}

export interface GeneratedItineraryDayInput {
  dayNumber: number
  dayDate: string
  items: GeneratedItineraryItemInput[]
}

export interface ApplyItineraryInput {
  /** 이미 있는 여행에 채워 넣을 때. 없으면 newTrip으로 새 여행을 만든다 */
  tripId?: string
  newTrip?: {
    title: string
    destination: string | null
    startDate: string | null
    endDate: string | null
    startTime: string | null
    endTime: string | null
    coverUrl: string | null
  }
  days: GeneratedItineraryDayInput[]
}

/**
 * AI가 짠 일정을 통째로 저장한다.
 *
 * 예전에는 항목마다 (장소 검색 → 장소 생성/조회 → 일정에 추가)를 순서대로
 * fetch/서버 액션으로 돌려서, 4일치 20~30개 항목이면 왕복이 100번을 넘었다.
 * 여기서는 검색은 한 번에 병렬로 보내고, DB 쓰기는 날짜·장소·일정 항목 단위로
 * 묶어서 각각 한 번의 select/insert로 끝낸다.
 */
export async function applyGeneratedItinerary(
  input: ApplyItineraryInput,
): Promise<{ tripId?: string; error?: string }> {
  const supabase = await createClient()
  const t = await getTranslations('trips')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  /* ── 1. 여행 준비 ─────────────────────────────────────────── */
  let tripId = input.tripId

  if (tripId) {
    const { data: member } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!member) return { error: 'forbidden' }
  } else if (input.newTrip) {
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        title: input.newTrip.title,
        destination: input.newTrip.destination,
        cover_url: input.newTrip.coverUrl,
        start_date: input.newTrip.startDate,
        end_date: input.newTrip.endDate,
        start_time: input.newTrip.startTime,
        end_time: input.newTrip.endTime,
        owner_id: user.id,
      })
      .select('id')
      .single()
    if (error || !trip) return { error: error?.message ?? t('createFailed') }

    await supabase
      .from('trip_members')
      .insert({ trip_id: trip.id, user_id: user.id, role: 'owner' })
    tripId = trip.id
  } else {
    return { error: 'missing_trip' }
  }

  const days = input.days.filter((d) => d.items.length > 0)
  if (days.length === 0) return { tripId }

  /* ── 2. 장소 검색 — 고유 검색어만, 전부 병렬로 ──────────────── */
  const uniqueQueries = [...new Set(days.flatMap((d) => d.items.map((i) => i.googleSearchQuery)))]
  const searchResults = await Promise.all(
    uniqueQueries.map(async (q) => [q, await searchPlacesText(q).catch(() => null)] as const),
  )
  const foundByQuery = new Map(searchResults.map(([q, places]) => [q, places?.[0] ?? null]))

  /* ── 3. 장소 upsert — 있는 것 한 번에 조회, 없는 것 한 번에 삽입 ─ */
  const foundPlaces = [...foundByQuery.values()].filter((p) => p !== null)
  const uniqueGoogleIds = [...new Set(foundPlaces.map((p) => p!.id))]

  const placeIdByGoogleId = new Map<string, string>()

  if (uniqueGoogleIds.length > 0) {
    const { data: existingPlaces } = await supabase
      .from('places')
      .select('id, google_place_id')
      .in('google_place_id', uniqueGoogleIds)

    for (const p of existingPlaces ?? []) {
      if (p.google_place_id) placeIdByGoogleId.set(p.google_place_id, p.id)
    }

    const missingGoogleIds = uniqueGoogleIds.filter((id) => !placeIdByGoogleId.has(id))

    if (missingGoogleIds.length > 0) {
      // 카테고리명 → id. AI가 준 category가 place_categories.name과 정확히
      // 일치하지 않을 수 있어(자유 텍스트) 매칭 안 되면 그냥 null로 둔다.
      const { data: categories } = await supabase.from('place_categories').select('id, name')
      const categoryIdByName = new Map((categories ?? []).map((c) => [c.name, c.id]))

      const toInsert = missingGoogleIds.map((googleId) => {
        const place = foundPlaces.find((p) => p!.id === googleId)!
        const item = days
          .flatMap((d) => d.items)
          .find((i) => foundByQuery.get(i.googleSearchQuery)?.id === googleId)
        return {
          google_place_id: place.id,
          name: place.displayName.text,
          address: place.formattedAddress ?? null,
          category_id: item ? (categoryIdByName.get(item.category) ?? null) : null,
          lat: place.location?.latitude ?? null,
          lng: place.location?.longitude ?? null,
        }
      })

      const { data: inserted } = await supabase
        .from('places')
        .insert(toInsert)
        .select('id, google_place_id')

      for (const p of inserted ?? []) {
        if (p.google_place_id) placeIdByGoogleId.set(p.google_place_id, p.id)
      }
    }
  }

  /* ── 4. itinerary_days upsert — 대상 날짜 한 번에 조회, 없는 것 한 번에 삽입 ─ */
  const targetDates = days.map((d) => d.dayDate)
  const { data: existingDays } = await supabase
    .from('itinerary_days')
    .select('id, day_date')
    .eq('trip_id', tripId)
    .in('day_date', targetDates)

  const dayIdByDate = new Map((existingDays ?? []).map((d) => [d.day_date, d.id]))
  const missingDays = days.filter((d) => !dayIdByDate.has(d.dayDate))

  if (missingDays.length > 0) {
    const { data: insertedDays } = await supabase
      .from('itinerary_days')
      .insert(
        missingDays.map((d) => ({
          trip_id: tripId,
          day_date: d.dayDate,
          day_number: d.dayNumber,
        })),
      )
      .select('id, day_date')

    for (const d of insertedDays ?? []) {
      dayIdByDate.set(d.day_date, d.id)
    }
  }

  /* ── 5. itinerary_items 일괄 삽입 ────────────────────────────── */
  // 대상 날은 새로 만든 날이거나 비어 있는 날(호출부가 보장)이라
  // order_index는 0부터 시작해도 안전하다.
  const itemRows = days.flatMap((day) => {
    const dayId = dayIdByDate.get(day.dayDate)
    if (!dayId) return []
    return day.items.map((item, i) => {
      const found = foundByQuery.get(item.googleSearchQuery)
      const placeId = found ? (placeIdByGoogleId.get(found.id) ?? null) : null
      return placeId
        ? {
            day_id: dayId,
            place_id: placeId,
            order_index: i,
            visit_time: item.visitTime || null,
            memo: item.memo || null,
          }
        : {
            day_id: dayId,
            place_id: null,
            item_type: 'memo',
            order_index: i,
            visit_time: item.visitTime || null,
            memo: [item.placeName, item.visitTime && `(${item.visitTime})`, item.memo]
              .filter(Boolean)
              .join(' '),
          }
    })
  })

  if (itemRows.length > 0) {
    const { data: insertedItems, error } = await supabase
      .from('itinerary_items')
      .insert(itemRows)
      .select('id, day_id, order_index')
    if (error) return { tripId, error: error.message }

    // 비용 산출 요청이 있으면 trip_expenses에 일괄 삽입
    const insertedMap = new Map(
      (insertedItems ?? []).map((r) => [`${r.day_id}:${r.order_index}`, r.id]),
    )
    const expenseRows = days.flatMap((day) => {
      const dayId = dayIdByDate.get(day.dayDate)
      if (!dayId) return []
      return day.items
        .map((item, i) => ({ item, i }))
        .filter(({ item }) => (item.estimatedCostKrw ?? 0) > 0)
        .map(({ item, i }) => ({
          trip_id: tripId,
          day_id: dayId,
          item_id: insertedMap.get(`${dayId}:${i}`) ?? null,
          amount: item.estimatedCostKrw!,
          category: item.costCategory || '기타',
          note: null,
        }))
    })
    if (expenseRows.length > 0) {
      await supabase.from('trip_expenses').insert(expenseRows)
    }
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/trips/${tripId}`)
  return { tripId }
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
    start_time?: string | null
    end_time?: string | null
    cover_url?: string | null
    destinations?: { destination: string; startDate: string; endDate: string }[] | null
  },
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
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

  const locale = await getLocale()
  revalidatePath(`/${locale}/trips/${tripId}`)
  revalidatePath(`/${locale}/trips/${tripId}/edit`)
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

export async function getTripDestination(tripId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('trips').select('destination').eq('id', tripId).maybeSingle()
  return data?.destination ?? null
}

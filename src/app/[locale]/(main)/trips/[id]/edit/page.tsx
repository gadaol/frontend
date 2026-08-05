import { notFound, redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import ScheduleEditClient from './_components/ScheduleEditClient'
import type { TripDetail } from '../page'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const { data: trip } = await supabase
    .from('trips')
    .select(
      `*,
      trip_members(user_id, role),
      trip_tags(tag),
      itinerary_days(
        id, day_number, day_date,
        itinerary_items(
          id, order_index, visit_time, memo, place_id,
          places(id, google_place_id, name, address, lat, lng, place_categories(name))
        )
      )`,
    )
    .eq('id', id)
    .single()

  if (!trip) notFound()

  const isMember = trip.trip_members.some((m) => m.user_id === user.id)
  if (!isMember) redirect(`/${locale}`)

  return <ScheduleEditClient trip={trip as TripDetail} />
}

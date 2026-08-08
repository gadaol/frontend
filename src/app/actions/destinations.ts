'use server'

import { createClient } from '@/lib/supabase/server'
import dayjs from '@/lib/dayjs'

export type UpcomingTrip = {
  id: string
  title: string
  destination: string | null
  start_date: string | null
  end_date: string | null
}

export async function getUpcomingTrips(): Promise<UpcomingTrip[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = dayjs().format('YYYY-MM-DD')
  const { data } = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date')
    .or(`end_date.gte.${today},end_date.is.null`)
    .order('start_date', { ascending: true })
    .limit(10)

  return data ?? []
}

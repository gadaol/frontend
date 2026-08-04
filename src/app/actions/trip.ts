'use server'

import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export async function createTrip(formData: FormData) {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const title = (formData.get('title') as string).trim()
  const startDate = (formData.get('start_date') as string) || null
  const endDate = (formData.get('end_date') as string) || null

  if (!title) return

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      title,
      start_date: startDate,
      end_date: endDate,
      owner_id: user.id,
      status: 'planning',
    })
    .select('id')
    .single()

  if (error || !trip) return

  await supabase.from('trip_members').insert({
    trip_id: trip.id,
    user_id: user.id,
    role: 'owner',
  })

  redirect(`/${locale}/trips/${trip.id}`)
}

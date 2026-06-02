'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const createTripSchema = z.object({
  title: z.string().min(1, '여행 이름을 입력해 주세요').max(50),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export type CreateTripState = {
  errors?: { title?: string[]; start_date?: string[]; end_date?: string[]; _form?: string[] }
}

export async function createTrip(
  _prev: CreateTripState,
  formData: FormData,
): Promise<CreateTripState> {
  const raw = {
    title: formData.get('title') as string,
    start_date: (formData.get('start_date') as string) || undefined,
    end_date: (formData.get('end_date') as string) || undefined,
  }

  const parsed = createTripSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { errors: { _form: ['로그인이 필요합니다'] } }

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      start_date: parsed.data.start_date ?? null,
      end_date: parsed.data.end_date ?? null,
      status: 'planning',
    })
    .select('id')
    .single()

  if (error || !trip) {
    return { errors: { _form: ['여행을 만들지 못했어요. 다시 시도해 주세요.'] } }
  }

  await supabase.from('trip_members').insert({
    trip_id: trip.id,
    user_id: user.id,
    role: 'owner',
  })

  redirect(`/trips/${trip.id}`)
}

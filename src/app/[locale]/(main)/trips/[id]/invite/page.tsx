import { notFound, redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateInviteToken } from '@/app/actions/invite'
import InviteClient from './_components/InviteClient'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = await params
  const locale = await getLocale()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const [{ data: trip }, token] = await Promise.all([
    supabase
      .from('trips')
      .select('id, title, owner_id, trip_members(user_id)')
      .eq('id', id)
      .single(),
    getOrCreateInviteToken(id),
  ])

  if (!trip) notFound()

  const isMember = trip.trip_members.some((m) => m.user_id === user.id)
  if (!isMember) redirect(`/${locale}/trips/${id}`)

  return (
    <InviteClient
      tripId={id}
      tripTitle={trip.title}
      inviteToken={token}
      memberIds={trip.trip_members.map((m) => m.user_id)}
    />
  )
}

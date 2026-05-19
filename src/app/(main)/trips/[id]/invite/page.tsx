import { PlaceholderPage } from '@/components/features/layout/PlaceholderPage'

type Props = { params: Promise<{ id: string }> }

export default async function TripInvitePage({ params }: Props) {
  const { id } = await params
  return <PlaceholderPage title="메이트 초대" path={`/trips/${id}/invite`} />
}

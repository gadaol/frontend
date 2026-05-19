import { PlaceholderPage } from '@/components/features/layout/PlaceholderPage'

type Props = { params: Promise<{ id: string }> }

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params
  return <PlaceholderPage title="여행 상세" path={`/trips/${id}`} />
}

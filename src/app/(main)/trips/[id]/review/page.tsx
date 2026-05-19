import { PlaceholderPage } from '@/components/features/layout/PlaceholderPage'

type Props = { params: Promise<{ id: string }> }

export default async function TripReviewPage({ params }: Props) {
  const { id } = await params
  return <PlaceholderPage title="여행 후기" path={`/trips/${id}/review`} priority="v2" />
}

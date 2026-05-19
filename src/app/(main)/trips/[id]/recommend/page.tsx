import { PlaceholderPage } from '@/components/features/layout/PlaceholderPage'

type Props = { params: Promise<{ id: string }> }

export default async function TripRecommendPage({ params }: Props) {
  const { id } = await params
  return (
    <PlaceholderPage title="AI 추천" path={`/trips/${id}/recommend`} priority="v2" />
  )
}

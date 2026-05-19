import { PlaceholderPage } from '@/components/features/layout/PlaceholderPage'

type Props = { params: Promise<{ id: string }> }

export default async function PlaceDetailPage({ params }: Props) {
  const { id } = await params
  return <PlaceholderPage title="장소 상세" path={`/places/${id}`} />
}

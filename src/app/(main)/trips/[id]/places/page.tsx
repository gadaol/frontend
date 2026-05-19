import { PlaceholderPage } from '@/components/features/layout/PlaceholderPage'

type Props = { params: Promise<{ id: string }> }

export default async function TripPlacesPage({ params }: Props) {
  const { id } = await params
  return <PlaceholderPage title="장소 검색" path={`/trips/${id}/places`} />
}

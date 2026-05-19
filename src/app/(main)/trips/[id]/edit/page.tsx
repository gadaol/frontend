import { PlaceholderPage } from '@/components/features/layout/PlaceholderPage'

type Props = { params: Promise<{ id: string }> }

export default async function TripEditPage({ params }: Props) {
  const { id } = await params
  return <PlaceholderPage title="일정 편집" path={`/trips/${id}/edit`} />
}

import PlacesSearch from './_components/PlacesSearch'
import { getTranslations } from 'next-intl/server'

export default async function PlacesPage() {
  const t = await getTranslations('places')
  return <PlacesSearch headerTitle={t('title')} />
}

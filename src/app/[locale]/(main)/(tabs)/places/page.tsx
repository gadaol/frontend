import { createClient } from '@/lib/supabase/server'
import PlacesSearch from './_components/PlacesSearch'

export default async function PlacesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialAvatar: string | null = null
  let initialName: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    initialAvatar = profile?.avatar_url ?? null
    initialName = profile?.name ?? null
  }

  return <PlacesSearch initialAvatar={initialAvatar} initialName={initialName} />
}

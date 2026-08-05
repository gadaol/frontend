'use server'

import { createClient } from '@/lib/supabase/server'

export type ProfileSearchResult = {
  id: string
  name: string | null
  avatar_url: string | null
}

export async function searchProfiles(query: string): Promise<ProfileSearchResult[]> {
  if (!query.trim()) return []
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .ilike('name', `%${query}%`)
    .neq('id', user.id)
    .limit(8)

  return data ?? []
}

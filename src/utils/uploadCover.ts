import { createClient } from '@/lib/supabase/client'

export async function uploadCoverImage(file: File, userId: string): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('trip-covers').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) return null

  const { data } = supabase.storage.from('trip-covers').getPublicUrl(path)
  return data.publicUrl
}

export function isGradient(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('linear-gradient') || url.startsWith('radial-gradient')
}

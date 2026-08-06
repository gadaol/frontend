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

/** 실제 업로드된 이미지 URL이 아니라 CSS 색상/그라디언트 프리셋인지 판별 (이름은 하위 호환 유지) */
export function isGradient(url: string | null | undefined): boolean {
  if (!url) return false
  return (
    url.startsWith('linear-gradient') ||
    url.startsWith('radial-gradient') ||
    url.startsWith('var(--color-') ||
    url.startsWith('color-mix(') ||
    url.startsWith('#') ||
    url.startsWith('rgb(') ||
    url.startsWith('hsl(')
  )
}

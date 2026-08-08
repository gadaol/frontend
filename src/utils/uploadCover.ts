import { createClient } from '@/lib/supabase/client'

export interface CoverUploadResult {
  url: string | null
  /** 실패 사유. 호출부가 사용자에게 보여줄 수 있도록 삼키지 않고 돌려준다 */
  error: string | null
}

export async function uploadCoverImage(file: File, userId: string): Promise<CoverUploadResult> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('trip-covers').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from('trip-covers').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
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

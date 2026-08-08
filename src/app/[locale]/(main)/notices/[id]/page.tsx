import { notFound, redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import Badge, { type BadgeProps } from '@/components/ui/Badge'
import type { Tables } from '@/types/supabase'

const CATEGORY_VARIANT: Record<string, NonNullable<BadgeProps['variant']>> = {
  공지: 'blue',
  업데이트: 'green',
  점검: 'orange',
  이벤트: 'purple',
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const locale = await getLocale()
  const t = await getTranslations('notices')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const { data: notice } = (await supabase.from('notices').select('*').eq('id', id).single()) as {
    data: Tables<'notices'> | null
    error: unknown
  }

  if (!notice) notFound()

  const variant = CATEGORY_VARIANT[notice.category] ?? 'gray'

  return (
    <div className="bg-bg2 min-h-dvh">
      <AppHeader title={t('title')} onBack="router" border />

      <div className="px-4 pt-5 pb-10">
        <div className="border-border rounded-2xl border bg-white px-5 py-5">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant={variant}>{notice.category}</Badge>
            <span className="text-ink3 text-[12px]">
              {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-ink mb-4 text-[17px] leading-snug font-bold">{notice.title}</h1>

          <div className="border-bg2 border-t pt-4">
            <p className="text-ink2 text-[14px] leading-relaxed whitespace-pre-line">
              {notice.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

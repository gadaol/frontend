import { notFound, redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import type { Tables } from '@/types/supabase'

const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  공지: { bg: '#EBF2FF', text: '#1B6FF0' },
  업데이트: { bg: '#D1FAE5', text: '#12B76A' },
  점검: { bg: '#FEF3C7', text: '#F79009' },
  이벤트: { bg: '#F3EFFF', text: '#7C3AED' },
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const { data: notice } = await supabase
    .from('notices')
    .select('*')
    .eq('id', id)
    .single() as { data: Tables<'notices'> | null; error: unknown }

  if (!notice) notFound()

  const color = CATEGORY_COLOR[notice.category] ?? { bg: '#F5F6F8', text: '#9099A8' }

  return (
    <div className="min-h-dvh bg-[#F5F6F8]">
      <AppHeader title="공지사항" onBack="router" border />

      <div className="px-4 pt-5 pb-10">
        <div className="rounded-2xl border border-[#E8EAED] bg-white px-5 py-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              {notice.category}
            </span>
            <span className="text-[12px] text-[#9099A8]">
              {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <h1 className="mb-4 text-[17px] font-bold leading-snug text-[#0F1117]">
            {notice.title}
          </h1>

          <div className="border-t border-[#F5F6F8] pt-4">
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#515966]">
              {notice.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

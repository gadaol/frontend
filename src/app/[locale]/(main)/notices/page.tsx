import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import type { Tables } from '@/types/supabase'

const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  공지: { bg: '#EBF2FF', text: '#1B6FF0' },
  업데이트: { bg: '#D1FAE5', text: '#12B76A' },
  점검: { bg: '#FEF3C7', text: '#F79009' },
  이벤트: { bg: '#F3EFFF', text: '#7C3AED' },
}

export default async function NoticesPage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const { data: notices } = await supabase
    .from('notices')
    .select('id, category, title, is_pinned, created_at')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false }) as {
    data: Pick<Tables<'notices'>, 'id' | 'category' | 'title' | 'is_pinned' | 'created_at'>[] | null
    error: unknown
  }

  return (
    <div className="min-h-dvh bg-[#F5F6F8]">
      <AppHeader title="공지사항" onBack="router" border />

      <div className="px-4 pt-4 pb-10">
        {!notices?.length && (
          <div className="flex flex-col items-center justify-center gap-2 py-24">
            <p className="text-[15px] font-semibold text-[#0F1117]">등록된 공지사항이 없어요</p>
            <p className="text-[13px] text-[#9099A8]">새로운 소식이 생기면 알려드릴게요</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {notices?.map((notice) => {
            const color = CATEGORY_COLOR[notice.category] ?? { bg: '#F5F6F8', text: '#9099A8' }
            return (
              <Link
                key={notice.id}
                href={`/${locale}/notices/${notice.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-[#E8EAED] bg-white px-4 py-4"
              >
                <div className="flex items-center gap-2">
                  {notice.is_pinned && (
                    <span className="rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-semibold text-[#F04438]">
                      고정
                    </span>
                  )}
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {notice.category}
                  </span>
                </div>
                <p className="text-[14px] font-semibold leading-snug text-[#0F1117]">
                  {notice.title}
                </p>
                <p className="text-[12px] text-[#9099A8]">
                  {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

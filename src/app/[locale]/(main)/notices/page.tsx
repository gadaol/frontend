import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
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

export default async function NoticesPage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const { data: notices } = (await supabase
    .from('notices')
    .select('id, category, title, is_pinned, created_at')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })) as {
    data: Pick<Tables<'notices'>, 'id' | 'category' | 'title' | 'is_pinned' | 'created_at'>[] | null
    error: unknown
  }

  return (
    <div className="bg-bg2 min-h-dvh">
      <AppHeader title="공지사항" onBack="router" border />

      <div className="px-4 pt-4 pb-10">
        {!notices?.length && (
          <div className="flex flex-col items-center justify-center gap-2 py-24">
            <p className="text-ink text-[15px] font-semibold">등록된 공지사항이 없어요</p>
            <p className="text-ink3 text-[13px]">새로운 소식이 생기면 알려드릴게요</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {notices?.map((notice) => {
            const variant = CATEGORY_VARIANT[notice.category] ?? 'gray'
            return (
              <Link
                key={notice.id}
                href={`/${locale}/notices/${notice.id}`}
                className="border-border flex flex-col gap-2 rounded-2xl border bg-white px-4 py-4"
              >
                <div className="flex items-center gap-2">
                  {notice.is_pinned && <Badge variant="red">고정</Badge>}
                  <Badge variant={variant}>{notice.category}</Badge>
                </div>
                <p className="text-ink text-[14px] leading-snug font-semibold">{notice.title}</p>
                <p className="text-ink3 text-[12px]">
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

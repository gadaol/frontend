import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import Badge from '@/components/ui/Badge'
import type { Tables } from '@/types/supabase'

const STATUS_LABEL: Record<string, { label: string; variant: 'orange' | 'green' }> = {
  pending: { label: '답변 대기', variant: 'orange' },
  answered: { label: '답변 완료', variant: 'green' },
}

export default async function InquiriesPage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const { data: inquiries } = (await supabase
    .from('inquiries')
    .select('id, category, title, is_public, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })) as {
    data:
      | Pick<
          Tables<'inquiries'>,
          'id' | 'category' | 'title' | 'is_public' | 'status' | 'created_at'
        >[]
      | null
    error: unknown
  }

  return (
    <div className="bg-bg2 min-h-dvh">
      <AppHeader
        title="문의하기"
        onBack="router"
        border
        right={
          <Link
            href={`/${locale}/inquiries/new`}
            className="text-primary text-[14px] font-semibold"
          >
            문의 작성
          </Link>
        }
      />

      <div className="px-4 pt-4 pb-10">
        {!inquiries?.length && (
          <div className="flex flex-col items-center justify-center gap-2 py-24">
            <p className="text-ink text-[15px] font-semibold">문의 내역이 없어요</p>
            <p className="text-ink3 text-[13px]">궁금한 점이 있으면 문의해주세요</p>
            <Link
              href={`/${locale}/inquiries/new`}
              className="bg-primary mt-3 rounded-2xl px-5 py-3 text-[14px] font-semibold text-white"
            >
              문의 작성하기
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {inquiries?.map((inq) => {
            const st = STATUS_LABEL[inq.status] ?? STATUS_LABEL.pending
            return (
              <Link
                key={inq.id}
                href={`/${locale}/inquiries/${inq.id}`}
                className="border-border flex flex-col gap-2 rounded-2xl border bg-white px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="gray">{inq.category}</Badge>
                    {!inq.is_public && <span className="text-ink3 text-[11px]">비공개</span>}
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <p className="text-ink text-[14px] leading-snug font-semibold">{inq.title}</p>
                <p className="text-ink3 text-[12px]">
                  {new Date(inq.created_at).toLocaleDateString('ko-KR', {
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

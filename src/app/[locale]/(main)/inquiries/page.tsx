import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import type { Tables } from '@/types/supabase'

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: '답변 대기', bg: '#FEF3C7', text: '#F79009' },
  answered: { label: '답변 완료', bg: '#D1FAE5', text: '#12B76A' },
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
    <div className="min-h-dvh bg-[#F5F6F8]">
      <AppHeader
        title="문의하기"
        onBack="router"
        border
        right={
          <Link
            href={`/${locale}/inquiries/new`}
            className="text-[14px] font-semibold text-[#1B6FF0]"
          >
            문의 작성
          </Link>
        }
      />

      <div className="px-4 pt-4 pb-10">
        {!inquiries?.length && (
          <div className="flex flex-col items-center justify-center gap-2 py-24">
            <p className="text-[15px] font-semibold text-[#0F1117]">문의 내역이 없어요</p>
            <p className="text-[13px] text-[#9099A8]">궁금한 점이 있으면 문의해주세요</p>
            <Link
              href={`/${locale}/inquiries/new`}
              className="mt-3 rounded-2xl bg-[#1B6FF0] px-5 py-3 text-[14px] font-semibold text-white"
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
                className="flex flex-col gap-2 rounded-2xl border border-[#E8EAED] bg-white px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#F5F6F8] px-2 py-0.5 text-[11px] font-medium text-[#9099A8]">
                      {inq.category}
                    </span>
                    {!inq.is_public && <span className="text-[11px] text-[#C5CAD3]">비공개</span>}
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: st.bg, color: st.text }}
                  >
                    {st.label}
                  </span>
                </div>
                <p className="text-[14px] leading-snug font-semibold text-[#0F1117]">{inq.title}</p>
                <p className="text-[12px] text-[#9099A8]">
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

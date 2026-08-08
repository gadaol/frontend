import { notFound, redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import Badge from '@/components/ui/Badge'
import type { Tables } from '@/types/supabase'

type InquiryWithAnswer = Tables<'inquiries'> & {
  inquiry_answers: Tables<'inquiry_answers'>[]
}

const STATUS_LABEL: Record<string, { label: string; variant: 'orange' | 'green' }> = {
  pending: { label: '답변 대기', variant: 'orange' },
  answered: { label: '답변 완료', variant: 'green' },
}

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const { data: inquiry } = (await supabase
    .from('inquiries')
    .select('*, inquiry_answers(*)')
    .eq('id', id)
    .single()) as { data: InquiryWithAnswer | null; error: unknown }

  if (!inquiry) notFound()
  if (inquiry.user_id !== user.id && !inquiry.is_public) notFound()

  const st = STATUS_LABEL[inquiry.status] ?? STATUS_LABEL.pending
  const answer = inquiry.inquiry_answers?.[0] ?? null

  return (
    <div className="bg-bg2 min-h-dvh">
      <AppHeader title="문의 상세" onBack="router" border />

      <div className="flex flex-col gap-3 px-4 pt-5 pb-10">
        {/* 문의 내용 */}
        <div className="border-border rounded-2xl border bg-white px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="gray">{inquiry.category}</Badge>
              {!inquiry.is_public && <span className="text-ink3 text-[11px]">비공개</span>}
            </div>
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>

          <h1 className="text-ink mb-1 text-[16px] font-bold">{inquiry.title}</h1>
          <p className="text-ink3 mb-4 text-[12px]">
            {new Date(inquiry.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <div className="border-bg2 border-t pt-4">
            <p className="text-ink2 text-[14px] leading-relaxed whitespace-pre-line">
              {inquiry.content}
            </p>
          </div>
        </div>

        {/* 답변 */}
        {answer ? (
          <div className="rounded-2xl border border-[#C5DBFF] bg-[#F0F6FF] px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-full">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6h8M6 2l4 4-4 4"
                    stroke="white"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-primary text-[13px] font-semibold">가다로그 팀 답변</p>
              <p className="text-ink3 ml-auto text-[12px]">
                {new Date(answer.created_at).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <p className="text-ink2 text-[14px] leading-relaxed whitespace-pre-line">
              {answer.content}
            </p>
          </div>
        ) : (
          <div className="border-border flex flex-col items-center gap-1.5 rounded-2xl border bg-white py-8">
            <p className="text-ink text-[14px] font-semibold">답변을 준비 중이에요</p>
            <p className="text-ink3 text-[12px]">빠른 시일 내에 답변 드릴게요</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { notFound, redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import type { Tables } from '@/types/supabase'

type InquiryWithAnswer = Tables<'inquiries'> & {
  inquiry_answers: Tables<'inquiry_answers'>[]
}

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: '답변 대기', bg: '#FEF3C7', text: '#F79009' },
  answered: { label: '답변 완료', bg: '#D1FAE5', text: '#12B76A' },
}

export default async function InquiryDetailPage({
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

  const { data: inquiry } = await supabase
    .from('inquiries')
    .select('*, inquiry_answers(*)')
    .eq('id', id)
    .single() as { data: InquiryWithAnswer | null; error: unknown }

  if (!inquiry) notFound()
  if (inquiry.user_id !== user.id && !inquiry.is_public) notFound()

  const st = STATUS_LABEL[inquiry.status] ?? STATUS_LABEL.pending
  const answer = inquiry.inquiry_answers?.[0] ?? null

  return (
    <div className="min-h-dvh bg-[#F5F6F8]">
      <AppHeader title="문의 상세" onBack="router" border />

      <div className="px-4 pt-5 pb-10 flex flex-col gap-3">
        {/* 문의 내용 */}
        <div className="rounded-2xl border border-[#E8EAED] bg-white px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#F5F6F8] px-2.5 py-0.5 text-[11px] font-medium text-[#9099A8]">
                {inquiry.category}
              </span>
              {!inquiry.is_public && (
                <span className="text-[11px] text-[#C5CAD3]">비공개</span>
              )}
            </div>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: st.bg, color: st.text }}
            >
              {st.label}
            </span>
          </div>

          <h1 className="mb-1 text-[16px] font-bold text-[#0F1117]">{inquiry.title}</h1>
          <p className="mb-4 text-[12px] text-[#9099A8]">
            {new Date(inquiry.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <div className="border-t border-[#F5F6F8] pt-4">
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#515966]">
              {inquiry.content}
            </p>
          </div>
        </div>

        {/* 답변 */}
        {answer ? (
          <div className="rounded-2xl border border-[#C5DBFF] bg-[#F0F6FF] px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B6FF0]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[13px] font-semibold text-[#1B6FF0]">가다올 팀 답변</p>
              <p className="ml-auto text-[12px] text-[#9099A8]">
                {new Date(answer.created_at).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#515966]">
              {answer.content}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#E8EAED] bg-white py-8">
            <p className="text-[14px] font-semibold text-[#0F1117]">답변을 준비 중이에요</p>
            <p className="text-[12px] text-[#9099A8]">빠른 시일 내에 답변 드릴게요</p>
          </div>
        )}
      </div>
    </div>
  )
}

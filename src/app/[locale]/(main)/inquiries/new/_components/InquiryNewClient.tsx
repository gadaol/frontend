'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/common/AppHeader'

/** DB(inquiries.category)에 저장되는 값은 한국어 그대로 두고 표시만 번역한다 */
const CATEGORIES = [
  { value: '서비스 이용', key: 'service' },
  { value: '결제/구독', key: 'billing' },
  { value: '오류/버그', key: 'bug' },
  { value: '계정', key: 'account' },
  { value: '기타', key: 'etc' },
] as const

export default function InquiryNewClient({ userId }: { userId: string }) {
  const t = useTranslations('inquiries')
  const router = useRouter()
  const locale = useLocale()

  const [category, setCategory] = useState<string>('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = category && title.trim() && content.trim() && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).from('inquiries').insert({
      user_id: userId,
      category,
      title: title.trim(),
      content: content.trim(),
      is_public: isPublic,
    })

    if (err) {
      setError(t('submitFailed'))
      setSubmitting(false)
      return
    }

    router.replace(`/${locale}/inquiries`)
  }

  return (
    <div className="bg-bg2 min-h-dvh">
      <AppHeader title={t('newTitle')} onBack="router" border />

      <div className="px-4 pt-5 pb-10">
        {/* 카테고리 */}
        <p className="text-ink3 mb-2 pl-1 text-[12px] font-semibold">{t('category')}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = category === c.value
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className="rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors"
                style={{
                  borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: active ? 'var(--color-primary-light)' : '#fff',
                  color: active ? 'var(--color-primary)' : 'var(--color-ink2)',
                }}
              >
                {t(`cat.${c.key}` as never)}
              </button>
            )
          })}
        </div>

        {/* 제목 */}
        <p className="text-ink3 mb-2 pl-1 text-[12px] font-semibold">{t('subject')}</p>
        <div className="border-border mb-4 overflow-hidden rounded-2xl border bg-white px-4 py-3.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('subjectRequired')}
            maxLength={100}
            className="text-ink placeholder:text-ink3 w-full bg-transparent text-[15px] outline-none"
          />
        </div>

        {/* 내용 */}
        <p className="text-ink3 mb-2 pl-1 text-[12px] font-semibold">{t('content')}</p>
        <div className="border-border mb-4 overflow-hidden rounded-2xl border bg-white px-4 py-3.5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('contentPlaceholder')}
            maxLength={2000}
            rows={8}
            className="text-ink placeholder:text-ink3 w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none"
          />
          <p className="text-ink3 mt-1 text-right text-[11px]">{content.length}/2000</p>
        </div>

        {/* 공개 여부 */}
        <div className="border-border mb-6 flex items-center justify-between rounded-2xl border bg-white px-4 py-3.5">
          <div>
            <p className="text-ink text-[14px] font-medium">{t('publicInquiry')}</p>
            <p className="text-ink3 mt-0.5 text-[12px]">{t('publicInquiryDesc')}</p>
          </div>
          <button
            onClick={() => setIsPublic((v) => !v)}
            className="relative h-7 w-12 rounded-full transition-colors"
            style={{ backgroundColor: isPublic ? 'var(--color-primary)' : 'var(--color-border)' }}
          >
            <span
              className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
              style={{ left: isPublic ? '24px' : '4px' }}
            />
          </button>
        </div>

        {error && <p className="text-error mb-3 text-center text-[13px]">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-primary w-full rounded-2xl py-3.5 text-[15px] font-bold text-white disabled:opacity-40"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </div>
  )
}

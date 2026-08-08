import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import Badge from '@/components/ui/Badge'
import type { Tables } from '@/types/database/database.types'

const PAGE_SIZE = 20

const STATUS_VARIANT: Record<string, 'orange' | 'green'> = {
  pending: 'orange',
  answered: 'green',
}

/** DB에 저장된 한국어 카테고리 → 번역 키 */
export const INQUIRY_CAT_KEY: Record<string, string> = {
  '서비스 이용': 'service',
  '결제/구독': 'billing',
  '오류/버그': 'bug',
  계정: 'account',
  기타: 'etc',
}

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const supabase = await createClient()
  const locale = await getLocale()
  const t = await getTranslations('inquiries')
  const { page: pageParam, q } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const query = q?.trim() ?? ''

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}`)

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let req = supabase
    .from('inquiries')
    .select('id, category, title, is_public, status, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (query) req = req.ilike('title', `%${query}%`)

  const { data: inquiries, count } = (await req.range(from, to)) as unknown as {
    data:
      | Pick<
          Tables<'inquiries'>,
          'id' | 'category' | 'title' | 'is_public' | 'status' | 'created_at'
        >[]
      | null
    count: number | null
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="bg-bg2 flex min-h-dvh flex-col">
      <AppHeader
        title={t('title')}
        onBack="router"
        border
        right={
          <Link
            href={`/${locale}/inquiries/new`}
            className="text-primary text-[14px] font-semibold"
          >
            {t('newTitle')}
          </Link>
        }
      />

      {/* 검색 */}
      <div className="bg-bg border-border border-b px-4 py-2.5">
        <form method="get" className="flex items-center gap-2">
          <div className="border-border bg-bg2 flex flex-1 items-center gap-2 rounded-xl border px-3 py-2">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4" stroke="var(--color-ink3)" strokeWidth="1.4" />
              <path
                d="M10 10l2.5 2.5"
                stroke="var(--color-ink3)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder={t('searchPlaceholder')}
              className="text-ink placeholder:text-ink3 flex-1 bg-transparent text-[13px] outline-none"
            />
          </div>
        </form>
      </div>

      {/* 목록 */}
      <div className="bg-bg flex-1">
        {!inquiries?.length ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-20">
            <p className="text-ink text-[14px] font-semibold">
              {query ? t('noResults', { query }) : t('empty')}
            </p>
            {query ? (
              <Link href={`/${locale}/inquiries`} className="text-primary text-[13px]">
                {t('viewAll')}
              </Link>
            ) : (
              <Link
                href={`/${locale}/inquiries/new`}
                className="bg-primary mt-2 rounded-2xl px-5 py-2.5 text-[13px] font-semibold text-white"
              >
                {t('writeNew')}
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {inquiries.map((inq) => {
              const answered = inq.status === 'answered'
              return (
                <li key={inq.id}>
                  <Link
                    href={`/${locale}/inquiries/${inq.id}`}
                    className="flex items-center gap-2.5 px-4 py-3 active:bg-gray-50"
                  >
                    <Badge variant="gray">
                      {t(`cat.${INQUIRY_CAT_KEY[inq.category] ?? 'etc'}` as never)}
                    </Badge>
                    <span className="text-ink min-w-0 flex-1 truncate text-[13px] font-medium">
                      {inq.title}
                      {!inq.is_public && (
                        <span className="text-ink3 ml-1 text-[11px] font-normal">🔒</span>
                      )}
                    </span>
                    <Badge variant={STATUS_VARIANT[inq.status] ?? 'orange'}>
                      {answered ? t('statusAnswered') : t('statusPending')}
                    </Badge>
                    <span className="text-ink3 flex-shrink-0 text-[11px]">
                      {new Date(inq.created_at).toLocaleDateString('ko-KR', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="flex-shrink-0"
                    >
                      <path
                        d="M5 3l4 4-4 4"
                        stroke="var(--color-ink3)"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="border-border border-t bg-white px-4 py-3">
          <div className="flex items-center justify-center gap-1">
            <PagingLink
              href={`/${locale}/inquiries?${query ? `q=${encodeURIComponent(query)}&` : ''}page=${page - 1}`}
              disabled={page <= 1}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M9 3L5 7l4 4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </PagingLink>
            {getPageNums(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="text-ink3 w-8 text-center text-[12px]">
                  …
                </span>
              ) : (
                <PagingLink
                  key={p}
                  href={`/${locale}/inquiries?${query ? `q=${encodeURIComponent(query)}&` : ''}page=${p}`}
                  active={p === page}
                >
                  {p}
                </PagingLink>
              ),
            )}
            <PagingLink
              href={`/${locale}/inquiries?${query ? `q=${encodeURIComponent(query)}&` : ''}page=${page + 1}`}
              disabled={page >= totalPages}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M5 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </PagingLink>
          </div>
          <p className="text-ink3 mt-1 text-center text-[11px]">
            {t('pageInfo', { page, total: totalPages, count: count ?? 0 })}
          </p>
        </div>
      )}
    </div>
  )
}

function getPageNums(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}

function PagingLink({
  href,
  children,
  active,
  disabled,
}: {
  href: string
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
}) {
  return (
    <Link
      href={href}
      aria-disabled={disabled}
      className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-[12px] font-medium ${
        disabled
          ? 'pointer-events-none opacity-30'
          : active
            ? 'bg-primary text-white'
            : 'text-ink2 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  )
}

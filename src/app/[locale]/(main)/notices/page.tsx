import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/common/AppHeader'
import Badge, { type BadgeProps } from '@/components/ui/Badge'
import type { Tables } from '@/types/supabase'

const PAGE_SIZE = 20

const CATEGORY_VARIANT: Record<string, NonNullable<BadgeProps['variant']>> = {
  공지: 'blue',
  업데이트: 'green',
  점검: 'orange',
  이벤트: 'purple',
}

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const supabase = await createClient()
  const locale = await getLocale()
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
    .from('notices')
    .select('id, category, title, is_pinned, created_at', { count: 'exact' })
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (query) req = req.ilike('title', `%${query}%`)

  const { data: notices, count } = (await req.range(from, to)) as unknown as {
    data: Pick<Tables<'notices'>, 'id' | 'category' | 'title' | 'is_pinned' | 'created_at'>[] | null
    count: number | null
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="bg-bg2 flex min-h-dvh flex-col">
      <AppHeader title="공지사항" onBack="router" border />

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
              placeholder="공지 제목 검색"
              className="text-ink placeholder:text-ink3 flex-1 bg-transparent text-[13px] outline-none"
            />
          </div>
        </form>
      </div>

      {/* 목록 */}
      <div className="bg-bg flex-1">
        {!notices?.length ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-20">
            <p className="text-ink text-[14px] font-semibold">
              {query ? `'${query}' 검색 결과가 없어요` : '등록된 공지사항이 없어요'}
            </p>
            {query && (
              <Link href={`/${locale}/notices`} className="text-primary text-[13px]">
                전체 보기
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {notices.map((notice) => {
              const variant = CATEGORY_VARIANT[notice.category] ?? 'gray'
              return (
                <li key={notice.id}>
                  <Link
                    href={`/${locale}/notices/${notice.id}`}
                    className="flex items-center gap-2.5 px-4 py-3 active:bg-gray-50"
                  >
                    {notice.is_pinned && <Badge variant="red">고정</Badge>}
                    <Badge variant={variant}>{notice.category}</Badge>
                    <span className="text-ink min-w-0 flex-1 truncate text-[13px] font-medium">
                      {notice.title}
                    </span>
                    <span className="text-ink3 flex-shrink-0 text-[11px]">
                      {new Date(notice.created_at).toLocaleDateString('ko-KR', {
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
              href={`/${locale}/notices?${query ? `q=${encodeURIComponent(query)}&` : ''}page=${page - 1}`}
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
                  href={`/${locale}/notices?${query ? `q=${encodeURIComponent(query)}&` : ''}page=${p}`}
                  active={p === page}
                >
                  {p}
                </PagingLink>
              ),
            )}
            <PagingLink
              href={`/${locale}/notices?${query ? `q=${encodeURIComponent(query)}&` : ''}page=${page + 1}`}
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
            {page} / {totalPages} 페이지 · 총 {count}건
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

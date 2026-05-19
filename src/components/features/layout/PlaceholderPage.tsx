import Link from 'next/link'

type PlaceholderPageProps = {
  title: string
  path: string
  priority?: 'MVP' | 'v2'
}

export function PlaceholderPage({ title, path, priority = 'MVP' }: PlaceholderPageProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          priority === 'v2'
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary-light text-primary'
        }`}
      >
        {priority}
      </span>
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="text-sm text-secondary">{path}</p>
      <p className="text-center text-sm text-tertiary">화면 구현 예정</p>
      <Link
        href="/"
        className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
      >
        온보딩으로
      </Link>
    </main>
  )
}

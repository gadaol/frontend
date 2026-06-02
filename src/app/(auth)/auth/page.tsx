import { GoogleLoginButton } from '@/components/features/auth/GoogleLoginButton'
import Link from 'next/link'

type Props = {
  searchParams: Promise<{ error?: string }>
}

export default async function AuthPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        {/* 로고 */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
            가
          </div>
          <h1 className="text-2xl font-bold text-ink">가다올</h1>
          <p className="text-sm text-secondary">계속하려면 로그인해 주세요</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-btn bg-primary-light px-4 py-3 text-sm text-primary">
            로그인 중 문제가 생겼어요. 다시 시도해 주세요.
          </div>
        )}

        {/* 로그인 버튼 영역 */}
        <div className="space-y-3">
          <GoogleLoginButton />

          <p className="text-center text-xs text-tertiary">
            추후 Apple, 카카오 로그인도 지원 예정이에요
          </p>
        </div>

        {/* 온보딩으로 돌아가기 */}
        <div className="text-center">
          <Link href="/" className="text-sm text-secondary underline-offset-4 hover:underline">
            ← 돌아가기
          </Link>
        </div>
      </div>
    </main>
  )
}

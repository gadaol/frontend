'use client'

import { useRouter } from 'next/navigation'

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <div className="flex h-dvh flex-col bg-white">
      <header className="flex h-14 flex-shrink-0 items-center border-b border-[#F0F0F0] px-2">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center"
          aria-label="뒤로가기"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

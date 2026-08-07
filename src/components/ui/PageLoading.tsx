'use client'

import Logo from '@/components/common/Logo'

interface Props {
  visible: boolean
}

export default function PageLoading({ visible }: Props) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <Logo size={36} variant="dark" className="!rounded-full" />
          <svg
            className="absolute -inset-1.5 animate-spin"
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
          >
            <circle cx="24" cy="24" r="22" stroke="white" strokeOpacity="0.15" strokeWidth="2" />
            <path
              d="M24 2 A22 22 0 0 1 46 24"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

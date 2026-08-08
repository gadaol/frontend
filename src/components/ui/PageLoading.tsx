'use client'

import Logo from '@/components/common/Logo'

interface Props {
  visible: boolean
}

export default function PageLoading({ visible }: Props) {
  if (!visible) return null

  return (
    // z-[200]: 이 화면은 "지금 진행 중인 작업이 끝날 때까지 아무것도 만지지
    // 마라"는 뜻이라 앱의 다른 오버레이(현재 최대 z-[111], 바텀시트 z-[80~81])
    // 보다 항상 위에 있어야 한다. 낮게 두면 시트 안에서 호출할 때 시트 뒤에
    // 가려 스피너가 아예 안 보이는 사고가 난다.
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
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

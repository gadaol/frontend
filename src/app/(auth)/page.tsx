import Link from 'next/link'
import { MapPin, BookmarkCheck, Sparkles } from 'lucide-react'

const features = [
  {
    icon: MapPin,
    title: '실시간 공유',
    desc: '메이트와 동시에 일정을 편집하고 투표해요',
  },
  {
    icon: BookmarkCheck,
    title: '백로그',
    desc: '못 간 장소를 모아뒀다가 다음 여행에 써요',
  },
  {
    icon: Sparkles,
    title: 'AI 추천',
    desc: '여행 스타일에 맞는 장소를 추천받아요',
  },
]

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-between px-6 py-12">
      {/* 로고 영역 */}
      <div className="flex flex-col items-center gap-2 pt-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
          가
        </div>
        <h1 className="text-3xl font-bold text-ink">가다올</h1>
        <p className="text-base text-secondary">같이 가다, 함께 올게</p>
      </div>

      {/* 핵심 기능 소개 */}
      <div className="w-full max-w-sm space-y-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4 rounded-card bg-bg-subtle p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Icon size={20} />
            </div>
            <div>
              <p className="font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-sm text-secondary">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="w-full max-w-sm space-y-3">
        <Link
          href="/auth"
          className="flex h-12 w-full items-center justify-center rounded-btn bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-hover active:scale-[0.98]"
        >
          시작하기
        </Link>
        <p className="text-center text-xs text-tertiary">
          시작하면 서비스 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다
        </p>
      </div>
    </main>
  )
}

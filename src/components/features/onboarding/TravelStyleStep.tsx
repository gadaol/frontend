'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import StepIndicator from './StepIndicator'

const PACE_OPTIONS = ['여유롭게', '빠르게', '계획파', '즉흥파']
const PLACE_OPTIONS = ['맛집', '자연', '카페', '관광지', '쇼핑', '액티비티']
const COMPANION_OPTIONS = ['혼자', '둘이서', '가족과', '친구들과']

interface Props {
  nickname: string
  onBack: () => void
}

export default function TravelStyleStep({ nickname, onBack }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const [pace, setPace] = useState<string[]>([])
  const [places, setPlaces] = useState<string[]>([])
  const [companion, setCompanion] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggle = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  }

  const handleSkip = async () => {
    await saveAndFinish({ nickname })
    router.push(`/${locale}/home`)
  }

  const handleSubmit = async () => {
    setLoading(true)
    await saveAndFinish({ nickname })
    router.push(`/${locale}/home`)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M13 16l-6-6 6-6"
                stroke="#9099A8"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <StepIndicator current={2} total={2} />
        </div>
        <button onClick={handleSkip} className="text-[14px] font-medium text-[#9099A8]">
          건너뛰기
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="mb-8">
          <div className="mb-1.5 text-[13px] font-medium text-[#1B6FF0]">STEP 2 / 2</div>
          <h1 className="mb-2 text-[24px] leading-snug font-bold text-[#0F1117]">
            어떤 여행을 좋아해요?
          </h1>
          <p className="text-[14px] leading-relaxed text-[#9099A8]">
            취향에 맞는 장소를 추천해드려요
            <br />
            여러 개 선택할 수 있어요
          </p>
        </div>

        <ChipSection
          label="여행 페이스"
          options={PACE_OPTIONS}
          selected={pace}
          onToggle={(v) => toggle(pace, v, setPace)}
        />
        <ChipSection
          label="선호 장소"
          options={PLACE_OPTIONS}
          selected={places}
          onToggle={(v) => toggle(places, v, setPlaces)}
        />
        <ChipSection
          label="주로 함께하는 여행"
          options={COMPANION_OPTIONS}
          selected={companion}
          onToggle={(v) => toggle(companion, v, setCompanion)}
        />

        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="h-[54px] w-full rounded-2xl bg-[#1B6FF0] text-[16px] font-semibold text-white disabled:opacity-40"
          >
            {loading ? '저장 중...' : '시작하기 🎉'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChipSection({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-[13px] font-medium text-[#0F1117]">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`h-9 rounded-full border-[1.5px] px-[14px] text-[13px] font-medium transition-colors ${
                active
                  ? 'border-[#1B6FF0] bg-[#EBF2FF] text-[#1B6FF0]'
                  : 'border-[#E8EAED] bg-white text-[#515966]'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

async function saveAndFinish({ nickname }: { nickname: string }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({
      ...(nickname.trim() ? { name: nickname.trim() } : {}),
      onboarding_completed: true,
    })
    .eq('id', user.id)
}

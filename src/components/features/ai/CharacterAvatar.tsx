import type { CharacterId } from '@/lib/ai/characters'

const SIZE = {
  xs: 'h-5 w-5',
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  xl: 'h-20 w-20',
}

interface Props {
  character: CharacterId
  size?: keyof typeof SIZE
  /** 지정하면 size 프리셋 대신 이 픽셀 값을 쓴다 */
  px?: number
}

/**
 * 원형 얼굴 아바타. 20px(xs)까지 줄어들 수 있어 눈·눈썹·입만 남기고 디테일을 뺐다.
 * 전신이 들어갈 자리에는 CharacterFigure를 쓴다.
 *
 * 일러스트 내부 색(크림/눈동자/홍조)은 디자인 토큰이 아니라 그림 고유의 값이라
 * 의도적으로 리터럴로 둔다. 브랜드 색만 토큰을 참조한다.
 */
export default function CharacterAvatar({ character, size = 'sm', px }: Props) {
  return (
    <span
      className={px ? 'block flex-shrink-0' : `${SIZE[size]} block flex-shrink-0`}
      style={px ? { width: px, height: px } : undefined}
    >
      {character === 'gada' ? <GadaFace /> : <RogFace />}
    </span>
  )
}

/** 가다 — 눈썹이 없어서 경계심이 사라진 얼굴 */
function GadaFace() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <circle cx="50" cy="50" r="50" fill="var(--color-gada)" />

      {/* 귀 */}
      <circle cx="20" cy="28" r="12" fill="#fdfbf6" />
      <circle cx="80" cy="26" r="11.5" fill="#fdfbf6" />

      {/* 얼굴 */}
      <ellipse cx="50" cy="55" rx="35" ry="33" fill="#fdfbf6" />

      {/* 눈 */}
      <ellipse cx="38" cy="53" rx="6.6" ry="8.2" fill="#2b2b38" />
      <ellipse cx="62" cy="53" rx="6.6" ry="8.2" fill="#2b2b38" />
      <circle cx="40.4" cy="49.4" r="2.5" fill="#fff" />
      <circle cx="64.4" cy="49.4" r="2.5" fill="#fff" />

      {/* 볼 */}
      <ellipse cx="22" cy="65" rx="7" ry="4.3" fill="#ff9cb0" opacity="0.72" />
      <ellipse cx="78" cy="65" rx="7" ry="4.3" fill="#ff9cb0" opacity="0.72" />

      {/* 부드럽게 올라간 입 */}
      <path
        d="M43.5 68 Q50 74 56.5 68"
        stroke="#2b2b38"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/** 로그 — 찡그린 눈썹과 반쯤 감긴 눈, 그런데 볼은 빨갛다 */
function RogFace() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <circle cx="50" cy="50" r="50" fill="var(--color-rog-deep)" />

      {/* 귀 */}
      <circle cx="20" cy="28" r="12" fill="#e9e2d8" />
      <circle cx="80" cy="30" r="11" fill="#e9e2d8" />

      {/* 얼굴 */}
      <ellipse cx="50" cy="55" rx="35" ry="33" fill="#e9e2d8" />

      {/* 눈썹 — 안쪽 끝이 내려온 찡그림 */}
      <path d="M28 36 L45 43" stroke="#2b2b38" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M72 36 L55 43" stroke="#2b2b38" strokeWidth="3.2" strokeLinecap="round" />

      {/* 눈 */}
      <ellipse cx="38" cy="55" rx="6.6" ry="8.2" fill="#2b2b38" />
      <ellipse cx="62" cy="55" rx="6.6" ry="8.2" fill="#2b2b38" />

      {/* 위에서 반쯤 덮은 눈꺼풀 */}
      <path d="M31 55.5 Q38 50 45 52 L45 45 L31 45 Z" fill="#e9e2d8" />
      <path d="M55 52 Q62 50 69 55.5 L69 45 L55 45 Z" fill="#e9e2d8" />

      {/* 하이라이트를 한쪽으로 몰아 시선 회피 */}
      <circle cx="35" cy="58.5" r="1.8" fill="#fff" opacity="0.75" />
      <circle cx="59" cy="58.5" r="1.8" fill="#fff" opacity="0.75" />

      {/* 볼 — 툴툴대도 얼굴은 빨개진다 */}
      <ellipse cx="22" cy="66" rx="7" ry="4.3" fill="#ff7a4d" opacity="0.5" />
      <ellipse cx="78" cy="66" rx="7" ry="4.3" fill="#ff7a4d" opacity="0.5" />

      {/* 뾰로통한 입 */}
      <path
        d="M42 69 Q50 73 58 70"
        stroke="#2b2b38"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

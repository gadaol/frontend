import type { CharacterId } from '@/lib/ai/characters'

const SIZE = {
  sm: 'h-[72px]',
  md: 'h-[88px]',
  lg: 'h-[124px]',
}

interface Props {
  character: CharacterId
  size?: keyof typeof SIZE
}

/**
 * 전신 캐릭터. 캐릭터 선택 UI나 어시스턴트 환영 화면처럼 캐릭터가 주인공인 자리에 쓴다.
 * 목록·말풍선처럼 작게 반복되는 자리에는 CharacterAvatar를 쓴다.
 *
 * 두 캐릭터는 실루엣이 완전히 같고 표정과 자세로만 성격이 갈린다.
 * 몸이 크림색이라 밝은 배경에 그대로 두면 묻히므로 브랜드 색 배경판을 항상 함께 그린다.
 */
export default function CharacterFigure({ character, size = 'md' }: Props) {
  return (
    <svg viewBox="0 0 140 168" className={`${SIZE[size]} w-auto flex-shrink-0`} aria-hidden>
      {character === 'gada' ? <GadaFigure /> : <RogFigure />}
    </svg>
  )
}

/** 가다 — 순둥이. 눈썹 없음, 고개를 살짝 기울이고 서 있다. */
function GadaFigure() {
  return (
    <>
      <rect x="0" y="0" width="140" height="168" rx="36" fill="var(--color-gada)" />

      <g transform="translate(10 10)">
        <ellipse cx="60" cy="137" rx="33" ry="5.5" fill="#000" opacity="0.14" />

        <g transform="rotate(-4 60 74)">
          {/* 귀 — 좌우를 살짝 어긋나게 둬 손그림 느낌을 남긴다 */}
          <circle cx="29" cy="27" r="13" fill="#fdfbf6" />
          <circle cx="91" cy="25" r="12.5" fill="#fdfbf6" />

          {/* 몸에 붙은 짧은 팔 */}
          <ellipse cx="17" cy="82" rx="8.5" ry="12" fill="#f2eee6" transform="rotate(-14 17 82)" />
          <ellipse cx="103" cy="80" rx="8.5" ry="12" fill="#f2eee6" transform="rotate(16 103 80)" />

          {/* 발 */}
          <ellipse cx="44" cy="122" rx="12" ry="8" fill="#f2eee6" />
          <ellipse cx="76" cy="122" rx="12" ry="8" fill="#f2eee6" />

          {/* 머리와 몸이 하나인 덩어리 */}
          <path
            d="M60 9 C86 9 102 30 102 57 C102 92 85 118 60 118 C35 118 18 92 18 57 C18 30 34 9 60 9 Z"
            fill="#fdfbf6"
          />

          {/* 눈 */}
          <ellipse cx="44" cy="61" rx="7.2" ry="8.6" fill="#2b2b38" />
          <ellipse cx="76" cy="61" rx="7.2" ry="8.6" fill="#2b2b38" />
          <circle cx="46.6" cy="57.2" r="2.7" fill="#fff" />
          <circle cx="78.6" cy="57.2" r="2.7" fill="#fff" />
          <circle cx="41.8" cy="64.5" r="1.2" fill="#fff" opacity="0.5" />
          <circle cx="73.8" cy="64.5" r="1.2" fill="#fff" opacity="0.5" />

          {/* 볼 */}
          <ellipse cx="28" cy="72" rx="7.5" ry="4.6" fill="#ff9cb0" opacity="0.72" />
          <ellipse cx="92" cy="72" rx="7.5" ry="4.6" fill="#ff9cb0" opacity="0.72" />

          {/* 입 */}
          <path
            d="M53.5 76.5 Q60 82.5 66.5 76.5"
            stroke="#2b2b38"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </g>
    </>
  )
}

/** 로그 — 츤데레. 팔짱과 짜증 마크로 퉁명함을, 볼 홍조로 속내를 남긴다. */
function RogFigure() {
  return (
    <>
      <rect x="0" y="0" width="140" height="168" rx="36" fill="var(--color-rog-deep)" />

      <g transform="translate(10 10)">
        <ellipse cx="60" cy="137" rx="33" ry="5.5" fill="#000" opacity="0.3" />

        {/* 짜증 마크 */}
        <g stroke="var(--color-rog-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.9">
          <path d="M103 29 L101 38" />
          <path d="M108 29 L106 38" />
          <path d="M100 32.5 L109.5 32" />
          <path d="M99.5 36 L109 35.5" />
        </g>

        <g transform="rotate(3 60 74)">
          {/* 귀 — 한쪽이 살짝 처져 시큰둥해 보인다 */}
          <circle cx="29" cy="27" r="13" fill="#e9e2d8" />
          <circle cx="91" cy="30" r="12" fill="#e9e2d8" />

          {/* 발 */}
          <ellipse cx="44" cy="122" rx="12" ry="8" fill="#d6cec1" />
          <ellipse cx="76" cy="122" rx="12" ry="8" fill="#d6cec1" />

          {/* 가다와 완전히 동일한 덩어리 */}
          <path
            d="M60 9 C86 9 102 30 102 57 C102 92 85 118 60 118 C35 118 18 92 18 57 C18 30 34 9 60 9 Z"
            fill="#e9e2d8"
          />

          {/* 눈썹 — 안쪽 끝이 푹 내려온 찡그림 */}
          <path d="M32.5 45.5 L50.5 52" stroke="#2b2b38" strokeWidth="3" strokeLinecap="round" />
          <path d="M87.5 45.5 L69.5 52" stroke="#2b2b38" strokeWidth="3" strokeLinecap="round" />

          {/* 눈 */}
          <ellipse cx="44" cy="62" rx="7.2" ry="8.6" fill="#2b2b38" />
          <ellipse cx="76" cy="62" rx="7.2" ry="8.6" fill="#2b2b38" />

          {/* 위에서 반쯤 덮은 눈꺼풀 */}
          <path d="M36.4 62.5 Q44 56.5 51.6 58.5 L51.6 51 L36.4 51 Z" fill="#e9e2d8" />
          <path d="M68.4 58.5 Q76 56.5 83.6 62.5 L83.6 51 L68.4 51 Z" fill="#e9e2d8" />

          {/* 하이라이트를 바깥으로 몰아 시선 회피 */}
          <circle cx="40.5" cy="65" r="1.9" fill="#fff" opacity="0.75" />
          <circle cx="72.5" cy="65" r="1.9" fill="#fff" opacity="0.75" />

          {/* 볼 — 츤데레의 핵심 */}
          <ellipse cx="28" cy="73" rx="7.5" ry="4.6" fill="#ff7a4d" opacity="0.5" />
          <ellipse cx="92" cy="73" rx="7.5" ry="4.6" fill="#ff7a4d" opacity="0.5" />

          {/* 뾰로통한 입 */}
          <path
            d="M51 77 Q59 81 67 78"
            stroke="#2b2b38"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />

          {/* 옆구리에 낀 기록 노트 */}
          <g transform="rotate(-8 22 96)">
            <rect x="13" y="83" width="19" height="26" rx="3.5" fill="var(--color-rog)" />
            <rect x="16.5" y="88" width="12" height="2.6" rx="1.3" fill="#fff" opacity="0.6" />
            <rect x="16.5" y="93.5" width="9" height="2.6" rx="1.3" fill="#fff" opacity="0.4" />
            <rect x="16.5" y="99" width="6.5" height="2.6" rx="1.3" fill="#fff" opacity="0.25" />
          </g>

          {/* 팔짱 — 방어적인 자세 */}
          <ellipse cx="52" cy="93" rx="19" ry="7.6" fill="#d6cec1" transform="rotate(-9 52 93)" />
          <ellipse
            cx="68"
            cy="99.5"
            rx="19"
            ry="7.6"
            fill="#c9c0b1"
            transform="rotate(7 68 99.5)"
          />
        </g>
      </g>
    </>
  )
}

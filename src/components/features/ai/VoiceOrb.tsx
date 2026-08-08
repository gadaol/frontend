'use client'

import CharacterAvatar from './CharacterAvatar'
import { CHARACTER_META, type CharacterId } from '@/lib/ai/characters'

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface Props {
  character: CharacterId
  state: VoiceState
  size?: number
}

/**
 * 음성 모드의 시각적 중심.
 * 상태를 색이 아니라 움직임으로 구분한다 — 소리를 눈으로 보는 느낌.
 */
export default function VoiceOrb({ character, state, size = 168 }: Props) {
  const color = CHARACTER_META[character].color

  const coreAnim = state === 'speaking' ? 'orb-pulse' : state === 'idle' ? 'orb-breathe' : ''

  return (
    <div
      className="relative flex flex-shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* 듣는 중 — 파문 두 겹이 시차를 두고 번진다 */}
      {state === 'listening' && (
        <>
          <span
            className="orb-ripple absolute inset-0 rounded-full"
            style={{ border: `2px solid ${color}` }}
          />
          <span
            className="orb-ripple absolute inset-0 rounded-full"
            style={{ border: `2px solid ${color}`, animationDelay: '1s' }}
          />
        </>
      )}

      {/* 생각 중 — 궤도 위의 점 하나 */}
      {state === 'thinking' && (
        <span className="orb-orbit absolute inset-0">
          <span
            className="absolute top-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full"
            style={{ background: color }}
          />
        </span>
      )}

      {/* 은은한 광채 */}
      <span
        className="absolute rounded-full transition-all duration-500"
        style={{
          width: size * 0.86,
          height: size * 0.86,
          background: color,
          opacity: state === 'idle' ? 0.1 : 0.18,
          filter: 'blur(24px)',
        }}
      />

      {/* 본체 */}
      <div
        className={`${coreAnim} relative flex items-center justify-center rounded-full transition-shadow duration-500`}
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background: '#fff',
          boxShadow: state === 'idle' ? '0 4px 24px rgba(0,0,0,0.08)' : `0 6px 32px ${color}40`,
        }}
      >
        <CharacterAvatar character={character} px={size * 0.48} />
      </div>
    </div>
  )
}

import type { CharacterId } from '@/lib/ai/characters'

const SIZE = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-8 w-8 text-[13px]',
  md: 'h-12 w-12 text-[20px]',
  xl: 'h-20 w-20 text-[32px]',
}

const STYLE: Record<CharacterId, { bg: string; label: string }> = {
  kakali: { bg: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)', label: '까' },
  dajeong: { bg: 'linear-gradient(135deg, #1b6ff0 0%, #7c3aed 100%)', label: '다' },
}

interface Props {
  character: CharacterId
  size?: keyof typeof SIZE
}

export default function CharacterAvatar({ character, size = 'sm' }: Props) {
  const { bg, label } = STYLE[character]
  return (
    <div
      className={`${SIZE[size]} flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white`}
      style={{ background: bg }}
    >
      {label}
    </div>
  )
}

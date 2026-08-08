'use client'

import { useAssistantStore } from '@/lib/ai/store'
import CharacterAvatar from './CharacterAvatar'

export default function AssistantButton() {
  const { open, character } = useAssistantStore()

  return (
    <button
      onClick={() => open()}
      className="fixed right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-black/20 transition-transform active:scale-95"
      style={{
        bottom: 'calc(56px + env(safe-area-inset-bottom) + 12px)',
        background: character === 'kakali'
          ? 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)'
          : 'linear-gradient(135deg, #1b6ff0 0%, #7c3aed 100%)',
      }}
      aria-label="AI 비서 열기"
    >
      <CharacterAvatar character={character} size="md" />
    </button>
  )
}

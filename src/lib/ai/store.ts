import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CharacterId } from './characters'

interface AssistantStore {
  isOpen: boolean
  character: CharacterId
  initialPrompt: string | null
  open: (opts?: { prompt?: string }) => void
  close: () => void
  setCharacter: (c: CharacterId) => void
  clearInitialPrompt: () => void
}

export const useAssistantStore = create<AssistantStore>()(
  persist(
    (set) => ({
      isOpen: false,
      character: 'gada',
      initialPrompt: null,
      open: (opts) => set({ isOpen: true, initialPrompt: opts?.prompt ?? null }),
      close: () => set({ isOpen: false }),
      setCharacter: (character) => set({ character }),
      clearInitialPrompt: () => set({ initialPrompt: null }),
    }),
    {
      name: 'gadarog-assistant',
      partialize: (state) => ({ character: state.character }),
    },
  ),
)

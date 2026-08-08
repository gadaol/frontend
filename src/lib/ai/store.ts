import { create } from 'zustand'
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

export const useAssistantStore = create<AssistantStore>()((set) => ({
  isOpen: false,
  character: 'dajeong',
  initialPrompt: null,
  open: (opts) => set({ isOpen: true, initialPrompt: opts?.prompt ?? null }),
  close: () => set({ isOpen: false }),
  setCharacter: (character) => set({ character }),
  clearInitialPrompt: () => set({ initialPrompt: null }),
}))

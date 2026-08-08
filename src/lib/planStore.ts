import { create } from 'zustand'
import type { Plan } from '@/utils/plans'

interface PlanStore {
  plan: Plan
  loaded: boolean
  setPlan: (p: Plan) => void
}

export const usePlanStore = create<PlanStore>()((set) => ({
  plan: 'free',
  loaded: false,
  setPlan: (plan) => set({ plan, loaded: true }),
}))

export type { CharacterId, Locale } from '@/lib/ai/characters'
export type { GeneratedItinerary } from '@/app/api/ai/itinerary/route'

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantRequest {
  messages: AssistantMessage[]
  character: import('@/lib/ai/characters').CharacterId
  locale: import('@/lib/ai/characters').Locale
  tripId?: string
}

export interface ItineraryRequest {
  destination: string
  startDate: string
  endDate: string
  style?: string[]
  companion?: string
  locale?: import('@/lib/ai/characters').Locale
}

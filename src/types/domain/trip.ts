import type { Trip, TripMember, ItineraryDay, ItineraryItem, Place } from '../db'

export interface TripWithDetails extends Trip {
  trip_members: TripMember[]
  itinerary_days: (ItineraryDay & {
    itinerary_items: (ItineraryItem & { places: Place | null })[]
  })[]
}

export interface ItineraryDragItem {
  id: string
  dayId: string
  orderIndex: number
  placeId: string | null
  memo: string | null
}

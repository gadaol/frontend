import type { Place, PlaceCategory } from '../db'

export interface PlaceWithCategory extends Place {
  place_categories: PlaceCategory | null
}

export interface MapMarker {
  placeId: string
  lat: number
  lng: number
  name: string
  selected: boolean
}

export interface GooglePlaceResult {
  googlePlaceId: string
  name: string
  address: string
  lat: number
  lng: number
}

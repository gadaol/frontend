export type GooglePlace = {
  id: string
  displayName: { text: string; languageCode: string }
  formattedAddress: string
  types: string[]
  rating?: number
  userRatingCount?: number
  location?: { latitude: number; longitude: number }
}

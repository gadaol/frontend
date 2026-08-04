import type { Tables } from '@/types/database/database.types'

export type TripMember = Pick<Tables<'trip_members'>, 'user_id' | 'role'>
export type TripTag = Pick<Tables<'trip_tags'>, 'tag'>

export type TripWithMembers = Tables<'trips'> & {
  trip_members: TripMember[]
  trip_tags: TripTag[]
}

export type BacklogItemWithPlace = Tables<'backlog_items'> & {
  places:
    | (Pick<Tables<'places'>, 'google_place_id' | 'name' | 'address'> & {
        place_categories: Pick<Tables<'place_categories'>, 'name'> | null
      })
    | null
}

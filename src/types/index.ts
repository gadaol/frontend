export type { Database } from './database.types'

import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Trip = Database['public']['Tables']['trips']['Row']
export type TripInsert = Database['public']['Tables']['trips']['Insert']
export type TripMember = Database['public']['Tables']['trip_members']['Row']
export type BacklogItem = Database['public']['Tables']['backlog_items']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

export type TripWithMembers = Trip & {
  trip_members: TripMember[]
}

export type TripStatus = Trip['status']
export type MemberRole = TripMember['role']
export type NotificationType = Notification['type']

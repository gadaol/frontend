export type { Database, Tables, TablesInsert, TablesUpdate } from './database.types'

import type { Database } from './database.types'

// 프로필 & 결제
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type PaymentLog = Database['public']['Tables']['payment_logs']['Row']

// 여행
export type Trip = Database['public']['Tables']['trips']['Row']
export type TripInsert = Database['public']['Tables']['trips']['Insert']
export type TripMember = Database['public']['Tables']['trip_members']['Row']
export type TripTag = Database['public']['Tables']['trip_tags']['Row']
export type TripReview = Database['public']['Tables']['trip_reviews']['Row']

// 일정
export type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row']
export type ItineraryItem = Database['public']['Tables']['itinerary_items']['Row']

// 장소
export type PlaceCategory = Database['public']['Tables']['place_categories']['Row']
export type Place = Database['public']['Tables']['places']['Row']
export type PlaceReview = Database['public']['Tables']['place_reviews']['Row']

// 협업
export type BacklogItem = Database['public']['Tables']['backlog_items']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// AI
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
export type PlaceInteraction = Database['public']['Tables']['place_interactions']['Row']
export type RecommendationLog = Database['public']['Tables']['recommendation_logs']['Row']

// 조합 타입
export type TripWithMembers = Trip & { trip_members: TripMember[] }
export type ItineraryDayWithItems = ItineraryDay & { itinerary_items: ItineraryItem[] }
export type PlaceWithCategory = Place & { place_categories: PlaceCategory | null }

// 리터럴 타입 (DB check constraint 미러)
export type TripStatus = 'planning' | 'ongoing' | 'completed'
export type MemberRole = 'owner' | 'editor' | 'viewer'
export type SubscriptionPlan = 'free' | 'pro' | 'team'
export type VoteType = 'like' | 'dislike'
export type NotificationType = 'invite' | 'vote' | 'edit' | 'system'

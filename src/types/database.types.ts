// Supabase CLI로 자동 생성: supabase gen types typescript --local > src/types/database.types.ts
// 직접 수정 금지 — 스키마 변경 시 재생성할 것

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string | null; created_at: string }
        Insert: { id: string; email?: string | null; created_at?: string }
        Update: { email?: string | null }
        Relationships: []
      }
      profiles: {
        Row: { id: string; name: string | null; avatar_url: string | null; created_at: string; updated_at: string }
        Insert: { id: string; name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string | null; avatar_url?: string | null; updated_at?: string }
        Relationships: []
      }
      subscriptions: {
        Row: { id: string; user_id: string; plan: 'free' | 'pro' | 'team'; status: 'active' | 'cancelled' | 'expired'; expires_at: string | null; created_at: string }
        Insert: { id?: string; user_id: string; plan?: 'free' | 'pro' | 'team'; status?: 'active' | 'cancelled' | 'expired'; expires_at?: string | null; created_at?: string }
        Update: { plan?: 'free' | 'pro' | 'team'; status?: 'active' | 'cancelled' | 'expired'; expires_at?: string | null }
        Relationships: []
      }
      payment_logs: {
        Row: { id: string; user_id: string; amount: number; currency: string; status: string; payload: Json | null; created_at: string }
        Insert: { id?: string; user_id: string; amount: number; currency?: string; status: string; payload?: Json | null; created_at?: string }
        Update: { status?: string }
        Relationships: []
      }
      place_categories: {
        Row: { id: string; name: string; icon: string | null }
        Insert: { id?: string; name: string; icon?: string | null }
        Update: { name?: string; icon?: string | null }
        Relationships: []
      }
      places: {
        Row: { id: string; google_place_id: string | null; name: string; address: string | null; lat: number | null; lng: number | null; category_id: string | null; created_at: string }
        Insert: { id?: string; google_place_id?: string | null; name: string; address?: string | null; lat?: number | null; lng?: number | null; category_id?: string | null; created_at?: string }
        Update: { name?: string; address?: string | null; lat?: number | null; lng?: number | null; category_id?: string | null }
        Relationships: []
      }
      trips: {
        Row: { id: string; owner_id: string; title: string; cover_url: string | null; start_date: string | null; end_date: string | null; status: 'planning' | 'ongoing' | 'completed'; created_at: string; updated_at: string }
        Insert: { id?: string; owner_id: string; title: string; cover_url?: string | null; start_date?: string | null; end_date?: string | null; status?: 'planning' | 'ongoing' | 'completed'; created_at?: string; updated_at?: string }
        Update: { title?: string; cover_url?: string | null; start_date?: string | null; end_date?: string | null; status?: 'planning' | 'ongoing' | 'completed'; updated_at?: string }
        Relationships: []
      }
      trip_members: {
        Row: { id: string; trip_id: string; user_id: string; role: 'owner' | 'editor' | 'viewer'; created_at: string }
        Insert: { id?: string; trip_id: string; user_id: string; role?: 'owner' | 'editor' | 'viewer'; created_at?: string }
        Update: { role?: 'owner' | 'editor' | 'viewer' }
        Relationships: []
      }
      trip_tags: {
        Row: { id: string; trip_id: string; tag: string }
        Insert: { id?: string; trip_id: string; tag: string }
        Update: { tag?: string }
        Relationships: []
      }
      trip_reviews: {
        Row: { id: string; trip_id: string; user_id: string; content: string | null; rating: number | null; created_at: string }
        Insert: { id?: string; trip_id: string; user_id: string; content?: string | null; rating?: number | null; created_at?: string }
        Update: { content?: string | null; rating?: number | null }
        Relationships: []
      }
      itinerary_days: {
        Row: { id: string; trip_id: string; day_date: string; day_number: number }
        Insert: { id?: string; trip_id: string; day_date: string; day_number: number }
        Update: { day_date?: string; day_number?: number }
        Relationships: []
      }
      itinerary_items: {
        Row: { id: string; day_id: string; place_id: string | null; order_index: number; memo: string | null; visit_time: string | null }
        Insert: { id?: string; day_id: string; place_id?: string | null; order_index: number; memo?: string | null; visit_time?: string | null }
        Update: { place_id?: string | null; order_index?: number; memo?: string | null; visit_time?: string | null }
        Relationships: []
      }
      place_reviews: {
        Row: { id: string; place_id: string; user_id: string; content: string | null; rating: number | null; created_at: string }
        Insert: { id?: string; place_id: string; user_id: string; content?: string | null; rating?: number | null; created_at?: string }
        Update: { content?: string | null; rating?: number | null }
        Relationships: []
      }
      backlog_items: {
        Row: { id: string; user_id: string; place_id: string | null; trip_id: string | null; memo: string | null; created_at: string }
        Insert: { id?: string; user_id: string; place_id?: string | null; trip_id?: string | null; memo?: string | null; created_at?: string }
        Update: { memo?: string | null }
        Relationships: []
      }
      votes: {
        Row: { id: string; trip_id: string; place_id: string; user_id: string; vote_type: 'like' | 'dislike'; created_at: string }
        Insert: { id?: string; trip_id: string; place_id: string; user_id: string; vote_type: 'like' | 'dislike'; created_at?: string }
        Update: { vote_type?: 'like' | 'dislike' }
        Relationships: []
      }
      notifications: {
        Row: { id: string; user_id: string; type: 'invite' | 'vote' | 'edit' | 'system'; payload: Json; is_read: boolean; created_at: string }
        Insert: { id?: string; user_id: string; type: 'invite' | 'vote' | 'edit' | 'system'; payload?: Json; is_read?: boolean; created_at?: string }
        Update: { is_read?: boolean }
        Relationships: []
      }
      user_preferences: {
        Row: { id: string; user_id: string; category_weights: Json | null; travel_style: Json | null; updated_at: string }
        Insert: { id?: string; user_id: string; category_weights?: Json | null; travel_style?: Json | null; updated_at?: string }
        Update: { category_weights?: Json | null; travel_style?: Json | null; updated_at?: string }
        Relationships: []
      }
      place_interactions: {
        Row: { id: string; user_id: string; place_id: string; interaction_type: string; created_at: string }
        Insert: { id?: string; user_id: string; place_id: string; interaction_type: string; created_at?: string }
        Update: { interaction_type?: string }
        Relationships: []
      }
      recommendation_logs: {
        Row: { id: string; user_id: string; trip_id: string | null; recommended_places: Json | null; created_at: string }
        Insert: { id?: string; user_id: string; trip_id?: string | null; recommended_places?: Json | null; created_at?: string }
        Update: { recommended_places?: Json | null }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

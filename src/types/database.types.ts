// Supabase CLI로 자동 생성: supabase gen types typescript --local > src/types/database.types.ts
// 직접 수정 금지

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          owner_id: string
          title: string
          cover_url: string | null
          start_date: string | null
          end_date: string | null
          status: 'planning' | 'ongoing' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          cover_url?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'planning' | 'ongoing' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          cover_url?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'planning' | 'ongoing' | 'completed'
          updated_at?: string
        }
      }
      trip_members: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
        Update: {
          role?: 'owner' | 'editor' | 'viewer'
        }
      }
      backlog_items: {
        Row: {
          id: string
          user_id: string
          place_id: string | null
          trip_id: string | null
          memo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          place_id?: string | null
          trip_id?: string | null
          memo?: string | null
          created_at?: string
        }
        Update: {
          memo?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'invite' | 'vote' | 'edit' | 'system'
          payload: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'invite' | 'vote' | 'edit' | 'system'
          payload?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

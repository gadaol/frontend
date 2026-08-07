// 자동 생성 — 스키마 변경 시 Supabase MCP generate_typescript_types로 재생성
// 직접 수정 금지

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      billing_keys: {
        Row: {
          id: string
          user_id: string
          billing_key: string
          customer_key: string
          card_company: string | null
          card_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          billing_key: string
          customer_key: string
          card_company?: string | null
          card_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          billing_key?: string
          customer_key?: string
          card_company?: string | null
          card_number?: string | null
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          user_id: string
          order_id: string
          plan: string
          period: string
          amount: number
          status: string
          payment_key: string | null
          approved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          plan: string
          period?: string
          amount: number
          status?: string
          payment_key?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_id?: string
          plan?: string
          period?: string
          amount?: number
          status?: string
          payment_key?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      phone_trial_grants: {
        Row: {
          phone: string
          granted_at: string
        }
        Insert: {
          phone: string
          granted_at?: string
        }
        Update: {
          phone?: string
          granted_at?: string
        }
        Relationships: []
      }
      backlog_items: {
        Row: {
          created_at: string | null
          id: string
          memo: string | null
          place_id: string | null
          trip_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          memo?: string | null
          place_id?: string | null
          trip_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          memo?: string | null
          place_id?: string | null
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'backlog_items_place_id_fkey'
            columns: ['place_id']
            isOneToOne: false
            referencedRelation: 'places'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'backlog_items_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      inquiries: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_public: boolean
          status: string
          title: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_public?: boolean
          status?: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      inquiry_answers: {
        Row: {
          content: string
          created_at: string
          id: string
          inquiry_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          inquiry_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          inquiry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inquiry_answers_inquiry_id_fkey'
            columns: ['inquiry_id']
            isOneToOne: false
            referencedRelation: 'inquiries'
            referencedColumns: ['id']
          },
        ]
      }
      itinerary_days: {
        Row: {
          day_date: string
          day_number: number
          id: string
          trip_id: string
        }
        Insert: {
          day_date: string
          day_number: number
          id?: string
          trip_id: string
        }
        Update: {
          day_date?: string
          day_number?: number
          id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'itinerary_days_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      itinerary_items: {
        Row: {
          day_id: string
          id: string
          memo: string | null
          order_index: number
          place_id: string | null
          visit_time: string | null
        }
        Insert: {
          day_id: string
          id?: string
          memo?: string | null
          order_index?: number
          place_id?: string | null
          visit_time?: string | null
        }
        Update: {
          day_id?: string
          id?: string
          memo?: string | null
          order_index?: number
          place_id?: string | null
          visit_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'itinerary_items_day_id_fkey'
            columns: ['day_id']
            isOneToOne: false
            referencedRelation: 'itinerary_days'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'itinerary_items_place_id_fkey'
            columns: ['place_id']
            isOneToOne: false
            referencedRelation: 'places'
            referencedColumns: ['id']
          },
        ]
      }
      notices: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          title: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean
          payload: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          payload?: Json
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          payload?: Json
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          payload: Json | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          payload?: Json | null
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          payload?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      place_categories: {
        Row: {
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      place_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'place_interactions_place_id_fkey'
            columns: ['place_id']
            isOneToOne: false
            referencedRelation: 'places'
            referencedColumns: ['id']
          },
        ]
      }
      place_reviews: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          place_id: string
          rating: number
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          place_id: string
          rating: number
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          place_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'place_reviews_place_id_fkey'
            columns: ['place_id']
            isOneToOne: false
            referencedRelation: 'places'
            referencedColumns: ['id']
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category_id: string | null
          created_at: string | null
          google_place_id: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          created_at?: string | null
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
        }
        Update: {
          address?: string | null
          category_id?: string | null
          created_at?: string | null
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'places_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'place_categories'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          name: string | null
          onboarding_completed: boolean
          phone: string | null
          travel_companion: string[] | null
          travel_pace: string[] | null
          travel_places: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          travel_companion?: string[] | null
          travel_pace?: string[] | null
          travel_places?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          travel_companion?: string[] | null
          travel_pace?: string[] | null
          travel_places?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recommendation_logs: {
        Row: {
          created_at: string | null
          id: string
          recommended_places: Json | null
          trip_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recommended_places?: Json | null
          trip_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recommended_places?: Json | null
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recommendation_logs_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_candidate_places: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          place_id: string
          trip_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          place_id: string
          trip_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          place_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_candidate_places_place_id_fkey'
            columns: ['place_id']
            isOneToOne: false
            referencedRelation: 'places'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trip_candidate_places_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trip_invites: {
        Row: {
          id: string
          trip_id: string
          token: string
          created_by: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          token?: string
          created_by: string
          expires_at?: string
          created_at?: string
        }
        Update: {
          expires_at?: string
        }
        Relationships: []
      }
      trip_members: {
        Row: {
          created_at: string | null
          id: string
          role: string
          status: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          status?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          status?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_members_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trip_reviews: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_public: boolean | null
          rating: number
          trip_id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          rating: number
          trip_id: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          rating?: number
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_reviews_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trip_tags: {
        Row: {
          id: string
          tag: string
          trip_id: string
        }
        Insert: {
          id?: string
          tag: string
          trip_id: string
        }
        Update: {
          id?: string
          tag?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trip_tags_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
      trips: {
        Row: {
          cover_url: string | null
          created_at: string | null
          destination: string | null
          end_date: string | null
          id: string
          owner_id: string
          start_date: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string
          owner_id: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string
          owner_id?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          category_weights: Json | null
          id: string
          notification_prefs: Json
          travel_style: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_weights?: Json | null
          id?: string
          notification_prefs?: Json
          travel_style?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_weights?: Json | null
          id?: string
          notification_prefs?: Json
          travel_style?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          place_id: string
          trip_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          place_id: string
          trip_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          place_id?: string
          trip_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'votes_place_id_fkey'
            columns: ['place_id']
            isOneToOne: false
            referencedRelation: 'places'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'votes_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

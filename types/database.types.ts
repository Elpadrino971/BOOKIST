export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          subscription_tier: 'free' | 'basic' | 'pro'
          subscription_status: 'active' | 'canceled' | 'past_due' | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          subscription_tier?: 'free' | 'basic' | 'pro'
          subscription_status?: 'active' | 'canceled' | 'past_due' | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          subscription_tier?: 'free' | 'basic' | 'pro'
          subscription_status?: 'active' | 'canceled' | 'past_due' | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      novels: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          genre: string
          hero_name: string
          secondary_characters: Json
          theme: string
          writing_style: string
          maturity_level: 'youth' | 'teen' | 'adult'
          cover_image_url: string | null
          cover_style: string
          total_tomes: number
          status: 'active' | 'completed' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          genre: string
          hero_name: string
          secondary_characters?: Json
          theme: string
          writing_style: string
          maturity_level: 'youth' | 'teen' | 'adult'
          cover_image_url?: string | null
          cover_style: string
          total_tomes?: number
          status?: 'active' | 'completed' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          genre?: string
          hero_name?: string
          secondary_characters?: Json
          theme?: string
          writing_style?: string
          maturity_level?: 'youth' | 'teen' | 'adult'
          cover_image_url?: string | null
          cover_style?: string
          total_tomes?: number
          status?: 'active' | 'completed' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      tomes: {
        Row: {
          id: string
          novel_id: string
          tome_number: number
          title: string
          summary: string | null
          word_count: number
          cover_image_url: string | null
          cliffhanger: string | null
          character_evolution: Json
          open_arcs: Json
          status: 'draft' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          novel_id: string
          tome_number: number
          title: string
          summary?: string | null
          word_count?: number
          cover_image_url?: string | null
          cliffhanger?: string | null
          character_evolution?: Json
          open_arcs?: Json
          status?: 'draft' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          novel_id?: string
          tome_number?: number
          title?: string
          summary?: string | null
          word_count?: number
          cover_image_url?: string | null
          cliffhanger?: string | null
          character_evolution?: Json
          open_arcs?: Json
          status?: 'draft' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          tome_id: string
          chapter_number: number
          title: string
          content: string
          word_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tome_id: string
          chapter_number: number
          title: string
          content: string
          word_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tome_id?: string
          chapter_number?: number
          title?: string
          content?: string
          word_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          month: string
          tomes_generated: number
          tokens_used: number
          covers_generated: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          tomes_generated?: number
          tokens_used?: number
          covers_generated?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          tomes_generated?: number
          tokens_used?: number
          covers_generated?: number
          created_at?: string
          updated_at?: string
        }
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
  }
}

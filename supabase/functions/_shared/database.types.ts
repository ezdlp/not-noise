
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
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sitemap_cache: {
        Row: {
          content: string
          created_at: string | null
          etag: string
          key: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          etag: string
          key: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          etag?: string
          key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sitemap_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          message: string
          source: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          message: string
          source: string
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          message?: string
          source?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      smart_links: {
        Row: {
          id: string
          user_id: string
          title: string
          artist_name: string
          artwork_url: string | null
          description: string | null
          created_at: string | null
          content_type: string
          email_capture_enabled: boolean | null
          email_capture_title: string | null
          email_capture_description: string | null
          slug: string | null
          meta_pixel_id: string | null
          meta_view_event: string | null
          meta_click_event: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          artist_name: string
          artwork_url?: string | null
          description?: string | null
          created_at?: string | null
          content_type?: string
          email_capture_enabled?: boolean | null
          email_capture_title?: string | null
          email_capture_description?: string | null
          slug?: string | null
          meta_pixel_id?: string | null
          meta_view_event?: string | null
          meta_click_event?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          artist_name?: string
          artwork_url?: string | null
          description?: string | null
          created_at?: string | null
          content_type?: string
          email_capture_enabled?: boolean | null
          email_capture_title?: string | null
          email_capture_description?: string | null
          slug?: string | null
          meta_pixel_id?: string | null
          meta_view_event?: string | null
          meta_click_event?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          created_at: string | null
          slug: string
          excerpt: string | null
          featured_image: string | null
          status: string
          seo_title: string | null
          meta_description: string | null
          focus_keyword: string | null
          author_name: string | null
          published_at: string | null
          visibility: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          created_at?: string | null
          slug: string
          excerpt?: string | null
          featured_image?: string | null
          status?: string
          seo_title?: string | null
          meta_description?: string | null
          focus_keyword?: string | null
          author_name?: string | null
          published_at?: string | null
          visibility?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string
          created_at?: string | null
          slug?: string
          excerpt?: string | null
          featured_image?: string | null
          status?: string
          seo_title?: string | null
          meta_description?: string | null
          focus_keyword?: string | null
          author_name?: string | null
          published_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add the promotions table with updated status enum type
      promotions: {
        Row: {
          id: string
          user_id: string
          spotify_track_id: string
          spotify_artist_id: string
          track_name: string
          track_artist: string
          genre: string
          status: "payment_pending" | "active" | "delivered" | "cancelled"
          total_cost: number
          submission_count: number
          approval_count: number | null
          estimated_streams: number | null
          initial_streams: number | null
          final_streams: number | null
          created_at: string
          updated_at: string | null
          start_date: string | null
          end_date: string | null
          success_rate: number | null
          estimated_additions: number | null
          package_tier: string | null
        }
        Insert: {
          id?: string
          user_id: string
          spotify_track_id: string
          spotify_artist_id: string
          track_name: string
          track_artist: string
          genre?: string
          status?: "payment_pending" | "active" | "delivered" | "cancelled"
          total_cost: number
          submission_count: number
          approval_count?: number | null
          estimated_streams?: number | null
          initial_streams?: number | null
          final_streams?: number | null
          created_at?: string
          updated_at?: string | null
          start_date?: string | null
          end_date?: string | null
          success_rate?: number | null
          estimated_additions?: number | null
          package_tier?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          spotify_track_id?: string
          spotify_artist_id?: string
          track_name?: string
          track_artist?: string
          genre?: string
          status?: "payment_pending" | "active" | "delivered" | "cancelled"
          total_cost?: number
          submission_count?: number
          approval_count?: number | null
          estimated_streams?: number | null
          initial_streams?: number | null
          final_streams?: number | null
          created_at?: string
          updated_at?: string | null
          start_date?: string | null
          end_date?: string | null
          success_rate?: number | null
          estimated_additions?: number | null
          package_tier?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      get_sitemap_url_count: {
        Args: Record<PropertyKey, never>
        Returns: { total_urls: number }[]
      }
      get_sitemap_urls_paginated: {
        Args: { p_offset: number; p_limit: number }
        Returns: { 
          url: string; 
          updated_at: string; 
          changefreq: string; 
          priority: number 
        }[]
      }
    }
    Enums: {}
  }
}

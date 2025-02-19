export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        Relationships: []
      }
      analytics_page_views: {
        Row: {
          country: string | null
          country_code: string | null
          created_at: string | null
          id: string
          ip_hash: string | null
          session_id: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          session_id?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          session_id?: string | null
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_revisions: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_keywords: string | null
          post_id: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          post_id?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          post_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          allow_comments: boolean | null
          author_id: string
          author_name: string | null
          content: string
          cover_image: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          focus_keyword: string | null
          format: string | null
          id: string
          is_featured: boolean | null
          is_sticky: boolean | null
          meta_description: string | null
          meta_keywords: string | null
          og_description: string | null
          og_title: string | null
          password: string | null
          published_at: string | null
          reading_time: number | null
          scheduled_for: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          twitter_description: string | null
          twitter_title: string | null
          updated_at: string | null
          visibility: string
        }
        Insert: {
          allow_comments?: boolean | null
          author_id: string
          author_name?: string | null
          content: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          focus_keyword?: string | null
          format?: string | null
          id?: string
          is_featured?: boolean | null
          is_sticky?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          og_description?: string | null
          og_title?: string | null
          password?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_for?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          twitter_description?: string | null
          twitter_title?: string | null
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          allow_comments?: boolean | null
          author_id?: string
          author_name?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          focus_keyword?: string | null
          format?: string | null
          id?: string
          is_featured?: boolean | null
          is_sticky?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          og_description?: string | null
          og_title?: string | null
          password?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_for?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          twitter_description?: string | null
          twitter_title?: string | null
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts_backup: {
        Row: {
          allow_comments: boolean | null
          author_id: string | null
          author_name: string | null
          content: string | null
          cover_image: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          focus_keyword: string | null
          format: string | null
          id: string | null
          is_featured: boolean | null
          is_sticky: boolean | null
          meta_description: string | null
          meta_keywords: string | null
          password: string | null
          published_at: string | null
          reading_time: number | null
          scheduled_for: string | null
          seo_title: string | null
          slug: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          allow_comments?: boolean | null
          author_id?: string | null
          author_name?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          focus_keyword?: string | null
          format?: string | null
          id?: string | null
          is_featured?: boolean | null
          is_sticky?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          password?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_for?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          allow_comments?: boolean | null
          author_id?: string | null
          author_name?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          focus_keyword?: string | null
          format?: string | null
          id?: string | null
          is_featured?: boolean | null
          is_sticky?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          password?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_for?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      blog_posts_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_post_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      early_adopter_counter: {
        Row: {
          created_at: string | null
          current_count: number | null
          id: string
          max_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          max_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_count?: number | null
          id?: string
          max_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_subscribers: {
        Row: {
          email: string
          id: string
          smart_link_id: string
          subscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          smart_link_id: string
          subscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          smart_link_id?: string
          subscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_subscribers_smart_link_id_fkey"
            columns: ["smart_link_id"]
            isOneToOne: false
            referencedRelation: "smart_links"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage: {
        Row: {
          created_at: string | null
          feature_name: string
          id: string
          last_reset_at: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          id?: string
          last_reset_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          id?: string
          last_reset_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_name: string
          id: string
          processed_items: number | null
          status: Database["public"]["Enums"]["import_status"] | null
          total_items: number
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name: string
          id?: string
          processed_items?: number | null
          status?: Database["public"]["Enums"]["import_status"] | null
          total_items: number
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          id?: string
          processed_items?: number | null
          status?: Database["public"]["Enums"]["import_status"] | null
          total_items?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          batch_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          mapped_user_id: string | null
          retries: number | null
          smart_link_id: string | null
          status: Database["public"]["Enums"]["import_status"] | null
          updated_at: string | null
          wp_post_id: string | null
          wp_user_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          mapped_user_id?: string | null
          retries?: number | null
          smart_link_id?: string | null
          status?: Database["public"]["Enums"]["import_status"] | null
          updated_at?: string | null
          wp_post_id?: string | null
          wp_user_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          mapped_user_id?: string | null
          retries?: number | null
          smart_link_id?: string | null
          status?: Database["public"]["Enums"]["import_status"] | null
          updated_at?: string | null
          wp_post_id?: string | null
          wp_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_logs_smart_link_id_fkey"
            columns: ["smart_link_id"]
            isOneToOne: false
            referencedRelation: "smart_links"
            referencedColumns: ["id"]
          },
        ]
      }
      link_views: {
        Row: {
          country: string | null
          country_code: string | null
          id: string
          ip_address: string | null
          ip_hash: string | null
          smart_link_id: string | null
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          country?: string | null
          country_code?: string | null
          id?: string
          ip_address?: string | null
          ip_hash?: string | null
          smart_link_id?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          country?: string | null
          country_code?: string | null
          id?: string
          ip_address?: string | null
          ip_hash?: string | null
          smart_link_id?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_views_smart_link_id_fkey"
            columns: ["smart_link_id"]
            isOneToOne: false
            referencedRelation: "smart_links"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          dimensions: Json | null
          file_path: string
          filename: string
          height: number | null
          id: string
          last_used: string | null
          metadata: Json | null
          mime_type: string
          size: number
          updated_at: string | null
          uploaded_by: string | null
          usage_count: number | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          dimensions?: Json | null
          file_path: string
          filename: string
          height?: number | null
          id?: string
          last_used?: string | null
          metadata?: Json | null
          mime_type: string
          size: number
          updated_at?: string | null
          uploaded_by?: string | null
          usage_count?: number | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          dimensions?: Json | null
          file_path?: string
          filename?: string
          height?: number | null
          id?: string
          last_used?: string | null
          metadata?: Json | null
          mime_type?: string
          size?: number
          updated_at?: string | null
          uploaded_by?: string | null
          usage_count?: number | null
          width?: number | null
        }
        Relationships: []
      }
      media_usage: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          media_id: string | null
          post_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          media_id?: string | null
          post_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          media_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_usage_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_usage_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      password_resets: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_clicks: {
        Row: {
          clicked_at: string | null
          country: string | null
          country_code: string | null
          id: string
          ip_address: string | null
          ip_hash: string | null
          platform_link_id: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string | null
          country?: string | null
          country_code?: string | null
          id?: string
          ip_address?: string | null
          ip_hash?: string | null
          platform_link_id?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string | null
          country?: string | null
          country_code?: string | null
          id?: string
          ip_address?: string | null
          ip_hash?: string | null
          platform_link_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_clicks_platform_link_id_fkey"
            columns: ["platform_link_id"]
            isOneToOne: false
            referencedRelation: "platform_links"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_links: {
        Row: {
          created_at: string | null
          id: string
          platform_id: string
          platform_name: string
          smart_link_id: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform_id: string
          platform_name: string
          smart_link_id?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform_id?: string
          platform_name?: string
          smart_link_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_links_smart_link_id_fkey"
            columns: ["smart_link_id"]
            isOneToOne: false
            referencedRelation: "smart_links"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          category: Database["public"]["Enums"]["playlist_category"]
          created_at: string | null
          followers: number
          genres: string[]
          id: string
          monthly_listeners: number
          name: string
          spotify_id: string
          total_tracks: number
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["playlist_category"]
          created_at?: string | null
          followers?: number
          genres?: string[]
          id?: string
          monthly_listeners?: number
          name: string
          spotify_id: string
          total_tracks?: number
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["playlist_category"]
          created_at?: string | null
          followers?: number
          genres?: string[]
          id?: string
          monthly_listeners?: number
          name?: string
          spotify_id?: string
          total_tracks?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_update_logs: {
        Row: {
          created_at: string | null
          id: string
          new_email: string | null
          old_email: string | null
          profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_email?: string | null
          old_email?: string | null
          profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_email?: string | null
          old_email?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_update_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          artist_name: string
          country: string
          created_at: string | null
          email: string | null
          hide_branding: boolean
          id: string
          music_genre: string
          name: string
          updated_at: string | null
        }
        Insert: {
          artist_name: string
          country: string
          created_at?: string | null
          email?: string | null
          hide_branding?: boolean
          id: string
          music_genre: string
          name: string
          updated_at?: string | null
        }
        Update: {
          artist_name?: string
          country?: string
          created_at?: string | null
          email?: string | null
          hide_branding?: boolean
          id?: string
          music_genre?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string | null
          end_date: string | null
          estimated_additions: number
          final_streams: number | null
          genre: string
          id: string
          initial_streams: number | null
          spotify_artist_id: string
          spotify_track_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["promotion_status"]
          submission_count: number
          success_rate: number
          total_cost: number
          track_artist: string
          track_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          estimated_additions: number
          final_streams?: number | null
          genre?: string
          id?: string
          initial_streams?: number | null
          spotify_artist_id: string
          spotify_track_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["promotion_status"]
          submission_count: number
          success_rate?: number
          total_cost: number
          track_artist: string
          track_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          estimated_additions?: number
          final_streams?: number | null
          genre?: string
          id?: string
          initial_streams?: number | null
          spotify_artist_id?: string
          spotify_track_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["promotion_status"]
          submission_count?: number
          success_rate?: number
          total_cost?: number
          track_artist?: string
          track_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      smart_links: {
        Row: {
          artist_name: string
          artwork_url: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          email_capture_description: string | null
          email_capture_enabled: boolean | null
          email_capture_title: string | null
          genre: string | null
          id: string
          isrc: string | null
          language: string | null
          lyrics: string | null
          meta_click_event: string | null
          meta_pixel_id: string | null
          meta_view_event: string | null
          playlist_metadata: Json | null
          release_date: string | null
          slug: string | null
          title: string
          upc: string | null
          updated_at: string | null
          user_id: string
          wp_total_clicks: number | null
          wp_total_views: number | null
        }
        Insert: {
          artist_name: string
          artwork_url?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          email_capture_description?: string | null
          email_capture_enabled?: boolean | null
          email_capture_title?: string | null
          genre?: string | null
          id?: string
          isrc?: string | null
          language?: string | null
          lyrics?: string | null
          meta_click_event?: string | null
          meta_pixel_id?: string | null
          meta_view_event?: string | null
          playlist_metadata?: Json | null
          release_date?: string | null
          slug?: string | null
          title: string
          upc?: string | null
          updated_at?: string | null
          user_id: string
          wp_total_clicks?: number | null
          wp_total_views?: number | null
        }
        Update: {
          artist_name?: string
          artwork_url?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          email_capture_description?: string | null
          email_capture_enabled?: boolean | null
          email_capture_title?: string | null
          genre?: string | null
          id?: string
          isrc?: string | null
          language?: string | null
          lyrics?: string | null
          meta_click_event?: string | null
          meta_pixel_id?: string | null
          meta_view_event?: string | null
          playlist_metadata?: Json | null
          release_date?: string | null
          slug?: string | null
          title?: string
          upc?: string | null
          updated_at?: string | null
          user_id?: string
          wp_total_clicks?: number | null
          wp_total_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_smart_links_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_links_backup: {
        Row: {
          artist_name: string | null
          artwork_url: string | null
          created_at: string | null
          description: string | null
          email_capture_description: string | null
          email_capture_enabled: boolean | null
          email_capture_title: string | null
          id: string | null
          meta_click_event: string | null
          meta_pixel_id: string | null
          meta_view_event: string | null
          release_date: string | null
          slug: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          artist_name?: string | null
          artwork_url?: string | null
          created_at?: string | null
          description?: string | null
          email_capture_description?: string | null
          email_capture_enabled?: boolean | null
          email_capture_title?: string | null
          id?: string | null
          meta_click_event?: string | null
          meta_pixel_id?: string | null
          meta_view_event?: string | null
          release_date?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          artist_name?: string | null
          artwork_url?: string | null
          created_at?: string | null
          description?: string | null
          email_capture_description?: string | null
          email_capture_enabled?: boolean | null
          email_capture_title?: string | null
          id?: string | null
          meta_click_event?: string | null
          meta_pixel_id?: string | null
          meta_view_event?: string | null
          release_date?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      social_media_assets: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          platform: Database["public"]["Enums"]["social_media_platform"]
          smart_link_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          platform: Database["public"]["Enums"]["social_media_platform"]
          smart_link_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          platform?: Database["public"]["Enums"]["social_media_platform"]
          smart_link_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_assets_smart_link_id_fkey"
            columns: ["smart_link_id"]
            isOneToOne: false
            referencedRelation: "smart_links"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_charges: {
        Row: {
          amount: number | null
          attrs: Json | null
          created: string | null
          currency: string | null
          customer: string | null
          description: string | null
          id: string | null
          invoice: string | null
          payment_intent: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          customer?: string | null
          description?: string | null
          id?: string | null
          invoice?: string | null
          payment_intent?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          customer?: string | null
          description?: string | null
          id?: string | null
          invoice?: string | null
          payment_intent?: string | null
          status?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          attrs: Json | null
          created: string | null
          description: string | null
          email: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          attrs?: Json | null
          created?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          attrs?: Json | null
          created?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      stripe_invoices: {
        Row: {
          attrs: Json | null
          currency: string | null
          customer: string | null
          id: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          subscription: string | null
          total: number | null
        }
        Insert: {
          attrs?: Json | null
          currency?: string | null
          customer?: string | null
          id?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          subscription?: string | null
          total?: number | null
        }
        Update: {
          attrs?: Json | null
          currency?: string | null
          customer?: string | null
          id?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          subscription?: string | null
          total?: number | null
        }
        Relationships: []
      }
      stripe_prices: {
        Row: {
          active: boolean | null
          attrs: Json | null
          created: string | null
          currency: string | null
          id: string | null
          product: string | null
          type: string | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          id?: string | null
          product?: string | null
          type?: string | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          id?: string | null
          product?: string | null
          type?: string | null
          unit_amount?: number | null
        }
        Relationships: []
      }
      stripe_products: {
        Row: {
          active: boolean | null
          attrs: Json | null
          id: string | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          attrs?: Json | null
          id?: string | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          attrs?: Json | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          attrs: Json | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer: string | null
          id: string | null
        }
        Insert: {
          attrs?: Json | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id?: string | null
        }
        Update: {
          attrs?: Json | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id?: string | null
        }
        Relationships: []
      }
      subscription_features: {
        Row: {
          created_at: string | null
          feature_limit: number | null
          feature_name: string
          id: string
          price_annual: number | null
          price_monthly: number | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feature_limit?: number | null
          feature_name: string
          id?: string
          price_annual?: number | null
          price_monthly?: number | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feature_limit?: number | null
          feature_name?: string
          id?: string
          price_annual?: number | null
          price_monthly?: number | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          is_early_adopter: boolean | null
          is_lifetime: boolean | null
          last_payment_date: string | null
          payment_status: string | null
          price_id: string | null
          status: string | null
          stripe_checkout_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_early_adopter?: boolean | null
          is_lifetime?: boolean | null
          last_payment_date?: string | null
          payment_status?: string | null
          price_id?: string | null
          status?: string | null
          stripe_checkout_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_early_adopter?: boolean | null
          is_lifetime?: boolean | null
          last_payment_date?: string | null
          payment_status?: string | null
          price_id?: string | null
          status?: string | null
          stripe_checkout_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscription_tier"
            columns: ["tier"]
            isOneToOne: false
            referencedRelation: "subscription_features"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_migration_status: {
        Row: {
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          password_reset_at: string | null
          reset_email_sent_at: string | null
          status:
            | Database["public"]["Enums"]["user_migration_status_type"]
            | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          password_reset_at?: string | null
          reset_email_sent_at?: string | null
          status?:
            | Database["public"]["Enums"]["user_migration_status_type"]
            | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          password_reset_at?: string | null
          reset_email_sent_at?: string | null
          status?:
            | Database["public"]["Enums"]["user_migration_status_type"]
            | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles_backup: {
        Row: {
          created_at: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      wp_user_mappings: {
        Row: {
          created_at: string | null
          id: string
          supabase_user_id: string | null
          updated_at: string | null
          wp_user_email: string | null
          wp_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          supabase_user_id?: string | null
          updated_at?: string | null
          wp_user_email?: string | null
          wp_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          supabase_user_id?: string | null
          updated_at?: string | null
          wp_user_email?: string | null
          wp_user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_smart_link_limit: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      get_analytics_stats: {
        Args: {
          p_start_date: string
        }
        Returns: {
          day: string
          page_views: number
          unique_visitors: number
          registered_users: number
          active_users: number
        }[]
      }
      get_daily_stats: {
        Args: {
          p_smart_link_id: string
          p_start_date: string
        }
        Returns: {
          day: string
          views: number
          clicks: number
        }[]
      }
      get_detailed_analytics_stats: {
        Args: {
          p_start_date: string
          p_end_date?: string
        }
        Returns: {
          day: string
          total_views: number
          unique_visitors: number
          registered_users: number
          pro_users: number
          returning_visitors: number
          active_users: number
          feature_usage: Json
        }[]
      }
      get_mau: {
        Args: {
          p_date?: string
        }
        Returns: {
          month: string
          active_users: number
          pro_users: number
          total_users: number
        }[]
      }
      get_sitemap_urls: {
        Args: Record<PropertyKey, never>
        Returns: {
          url: string
          updated_at: string
          changefreq: string
          priority: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      billing_period: "monthly" | "annual"
      content_type: "track" | "album" | "playlist"
      import_status: "pending" | "processing" | "completed" | "failed"
      playlist_category: "curated" | "algorithmic" | "editorial" | "independent"
      promotion_status: "pending" | "active" | "completed" | "rejected"
      social_media_platform:
        | "instagram_square"
        | "instagram_story"
        | "twitter"
        | "facebook"
        | "linkedin"
      subscription_tier: "free" | "pro" | "platinum"
      user_migration_status_type:
        | "pending"
        | "email_sent"
        | "password_reset"
        | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

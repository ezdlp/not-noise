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
      analytics_cache: {
        Row: {
          cache_data: Json
          cache_key: string
          created_at: string | null
          expires_at: string
          id: number
        }
        Insert: {
          cache_data: Json
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: number
        }
        Update: {
          cache_data?: Json
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: number
        }
        Relationships: []
      }
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
          config_value: string
          created_at: string | null
          key: string
          updated_at: string | null
        }
        Insert: {
          config_value: string
          created_at?: string | null
          key: string
          updated_at?: string | null
        }
        Update: {
          config_value?: string
          created_at?: string | null
          key?: string
          updated_at?: string | null
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
      campaign_result_data: {
        Row: {
          ai_analysis: Json | null
          campaign_id: string
          created_at: string | null
          id: string
          processed_at: string | null
          raw_data: Json
          stats: Json | null
        }
        Insert: {
          ai_analysis?: Json | null
          campaign_id: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          raw_data: Json
          stats?: Json | null
        }
        Update: {
          ai_analysis?: Json | null
          campaign_id?: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          raw_data?: Json
          stats?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_result_data_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_result_files: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
          processed: boolean | null
          promotion_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
          processed?: boolean | null
          promotion_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
          processed?: boolean | null
          promotion_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_result_files_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_results: {
        Row: {
          campaign_id: string
          created_at: string | null
          file_path: string
          id: string
          processed_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          file_path: string
          id?: string
          processed_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          file_path?: string
          id?: string
          processed_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_results_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotions"
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
      edge_function_logs: {
        Row: {
          created_at: string
          error_message: string | null
          function_name: string
          id: string
          request_data: Json | null
          status_code: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          function_name: string
          id?: string
          request_data?: Json | null
          status_code?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          function_name?: string
          id?: string
          request_data?: Json | null
          status_code?: number | null
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
      function_test_requests: {
        Row: {
          function_name: string
          id: string
          request_data: Json | null
          response_status: number | null
          timestamp: string
        }
        Insert: {
          function_name: string
          id?: string
          request_data?: Json | null
          response_status?: number | null
          timestamp?: string
        }
        Update: {
          function_name?: string
          id?: string
          request_data?: Json | null
          response_status?: number | null
          timestamp?: string
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
      playlist_campaigns: {
        Row: {
          accepted_count: number | null
          artist_name: string
          artwork_url: string | null
          created_at: string
          declined_count: number | null
          genre: string | null
          id: string
          release_date: string | null
          spotify_track_id: string | null
          status: string
          total_submissions: number | null
          track_title: string
          updated_at: string
        }
        Insert: {
          accepted_count?: number | null
          artist_name: string
          artwork_url?: string | null
          created_at?: string
          declined_count?: number | null
          genre?: string | null
          id?: string
          release_date?: string | null
          spotify_track_id?: string | null
          status?: string
          total_submissions?: number | null
          track_title: string
          updated_at?: string
        }
        Update: {
          accepted_count?: number | null
          artist_name?: string
          artwork_url?: string | null
          created_at?: string
          declined_count?: number | null
          genre?: string | null
          id?: string
          release_date?: string | null
          spotify_track_id?: string | null
          status?: string
          total_submissions?: number | null
          track_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      playlist_submissions: {
        Row: {
          campaign_id: string
          curator_name: string
          feedback: string | null
          id: string
          status: string
          timestamp: string
        }
        Insert: {
          campaign_id: string
          curator_name: string
          feedback?: string | null
          id?: string
          status?: string
          timestamp?: string
        }
        Update: {
          campaign_id?: string
          curator_name?: string
          feedback?: string | null
          id?: string
          status?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "playlist_campaigns"
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
          is_admin: boolean | null
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
          is_admin?: boolean | null
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
          is_admin?: boolean | null
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
          package_tier: string | null
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
          package_tier?: string | null
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
          package_tier?: string | null
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
      security_audit_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          performed_at: string
          resource_name: string
          resource_type: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          performed_at?: string
          resource_name: string
          resource_type: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          performed_at?: string
          resource_name?: string
          resource_type?: string
        }
        Relationships: []
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
          meta_pixel_added_at: string | null
          meta_pixel_grandfathered: boolean | null
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
          meta_pixel_added_at?: string | null
          meta_pixel_grandfathered?: boolean | null
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
          meta_pixel_added_at?: string | null
          meta_pixel_grandfathered?: boolean | null
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
      spotify_popularity_history: {
        Row: {
          id: string
          measured_at: string
          popularity_score: number
          smart_link_id: string
        }
        Insert: {
          id?: string
          measured_at?: string
          popularity_score: number
          smart_link_id: string
        }
        Update: {
          id?: string
          measured_at?: string
          popularity_score?: number
          smart_link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotify_popularity_history_smart_link_id_fkey"
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
            referencedRelation: "temp_subscription_tiers"
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
      system_notifications: {
        Row: {
          active: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          message: string
          title: string
          type: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message: string
          title: string
          type: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      temp_subscription_tiers: {
        Row: {
          tier: Database["public"]["Enums"]["subscription_tier"] | null
        }
        Insert: {
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
        }
        Update: {
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
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
      active_subscriptions: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string | null
          is_early_adopter: boolean | null
          is_lifetime: boolean | null
          last_payment_date: string | null
          payment_status: string | null
          price_id: string | null
          status: string | null
          stripe_checkout_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string | null
          is_early_adopter?: boolean | null
          is_lifetime?: boolean | null
          last_payment_date?: string | null
          payment_status?: string | null
          price_id?: string | null
          status?: string | null
          stripe_checkout_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string | null
          is_early_adopter?: boolean | null
          is_lifetime?: boolean | null
          last_payment_date?: string | null
          payment_status?: string | null
          price_id?: string | null
          status?: string | null
          stripe_checkout_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscription_tier"
            columns: ["tier"]
            isOneToOne: false
            referencedRelation: "temp_subscription_tiers"
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
      system_fixes: {
        Row: {
          applied_at: string | null
          description: string | null
          fix_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_smart_link_limit: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_analytics_dashboard_stats: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_previous_period?: boolean
        }
        Returns: {
          period: string
          product_visits: number
          smart_link_visits: number
          signups: number
          active_users: number
          pro_subscribers: number
          revenue: number
          social_cards_usage: number
          meta_pixel_usage: number
          email_capture_usage: number
        }[]
      }
      get_analytics_stats: {
        Args: { p_start_date: string }
        Returns: {
          day: string
          page_views: number
          unique_visitors: number
          registered_users: number
          active_users: number
          pro_subscribers: number
          total_revenue: number
        }[]
      }
      get_analytics_stats_with_trends: {
        Args: { p_start_date: string; p_end_date?: string }
        Returns: {
          period: string
          day: string
          page_views: number
          unique_visitors: number
          registered_users: number
          active_users: number
          pro_subscribers: number
          total_revenue: number
        }[]
      }
      get_basic_analytics_stats: {
        Args: { p_start_date: string; p_end_date?: string }
        Returns: {
          period: string
          day: string
          product_page_views: number
          smart_link_views: number
          unique_visitors: number
        }[]
      }
      get_cached_analytics_stats: {
        Args: {
          p_start_date: string
          p_end_date?: string
          p_cache_minutes?: number
        }
        Returns: Json
      }
      get_daily_stats: {
        Args: { p_smart_link_id: string; p_start_date: string }
        Returns: {
          day: string
          views: number
          clicks: number
        }[]
      }
      get_detailed_analytics_stats: {
        Args: { p_start_date: string; p_end_date?: string }
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
      get_improved_analytics_stats: {
        Args: { p_start_date: string; p_end_date?: string }
        Returns: {
          period: string
          day: string
          product_page_views: number
          smart_link_views: number
          unique_visitors: number
          registered_users: number
          active_users: number
          pro_subscribers: number
          total_revenue: number
          smart_links_created: number
          social_assets_created: number
          meta_pixels_added: number
          email_capture_enabled: number
        }[]
      }
      get_mau: {
        Args: { p_date?: string }
        Returns: {
          month: string
          active_users: number
          pro_users: number
          total_users: number
        }[]
      }
      get_monthly_active_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          month: string
          active_users: number
          pro_users: number
          total_users: number
        }[]
      }
      get_monthly_active_users_trend: {
        Args: { p_months?: number }
        Returns: {
          month: string
          active_users: number
          pro_users: number
        }[]
      }
      get_pro_feature_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          feature: string
          count: number
          percentage: number
        }[]
      }
      get_sitemap_url_count: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_urls: number
        }[]
      }
      get_sitemap_urls_fixed: {
        Args: { p_offset: number; p_limit: number }
        Returns: {
          url: string
          updated_at: string
          changefreq: string
          priority: number
        }[]
      }
      get_sitemap_urls_paginated: {
        Args: { p_offset: number; p_limit: number }
        Returns: {
          url: string
          updated_at: string
          changefreq: string
          priority: number
        }[]
      }
      get_spotify_popularity_history: {
        Args: {
          p_smart_link_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          measured_at: string
          popularity_score: number
        }[]
      }
      get_users_with_multiple_active_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          subscription_count: number
        }[]
      }
      handle_subscription_update: {
        Args: {
          p_user_id: string
          p_tier: string
          p_stripe_subscription_id: string
          p_stripe_customer_id: string
        }
        Returns: string
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      log_edge_function_error: {
        Args: {
          p_function_name: string
          p_request_data: Json
          p_error_message: string
          p_status_code?: number
        }
        Returns: string
      }
      test_create_checkout: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      billing_period: "monthly" | "annual"
      change_frequency:
        | "always"
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly"
        | "never"
      content_type: "track" | "album" | "playlist"
      import_status: "pending" | "processing" | "completed" | "failed"
      playlist_category: "curated" | "algorithmic" | "editorial" | "independent"
      promotion_status: "payment_pending" | "active" | "delivered" | "cancelled"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      billing_period: ["monthly", "annual"],
      change_frequency: [
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
      ],
      content_type: ["track", "album", "playlist"],
      import_status: ["pending", "processing", "completed", "failed"],
      playlist_category: ["curated", "algorithmic", "editorial", "independent"],
      promotion_status: ["payment_pending", "active", "delivered", "cancelled"],
      social_media_platform: [
        "instagram_square",
        "instagram_story",
        "twitter",
        "facebook",
        "linkedin",
      ],
      subscription_tier: ["free", "pro", "platinum"],
      user_migration_status_type: [
        "pending",
        "email_sent",
        "password_reset",
        "failed",
      ],
    },
  },
} as const

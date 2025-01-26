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
          password: string | null
          published_at: string | null
          reading_time: number | null
          scheduled_for: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          allow_comments?: boolean | null
          author_id: string
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
          password?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_for?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          allow_comments?: boolean | null
          author_id?: string
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
          password?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_for?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
          visibility?: string
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
      link_views: {
        Row: {
          country: string | null
          id: string
          ip_address: string | null
          smart_link_id: string | null
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          country?: string | null
          id?: string
          ip_address?: string | null
          smart_link_id?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          country?: string | null
          id?: string
          ip_address?: string | null
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
      platform_clicks: {
        Row: {
          clicked_at: string | null
          country: string | null
          id: string
          ip_address: string | null
          platform_link_id: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string | null
          country?: string | null
          id?: string
          ip_address?: string | null
          platform_link_id?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string | null
          country?: string | null
          id?: string
          ip_address?: string | null
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
      profiles: {
        Row: {
          artist_name: string
          country: string
          created_at: string | null
          email: string | null
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
          id?: string
          music_genre?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      smart_links: {
        Row: {
          artist_name: string
          artwork_url: string | null
          created_at: string | null
          email_capture_description: string | null
          email_capture_enabled: boolean | null
          email_capture_title: string | null
          id: string
          meta_click_event: string | null
          meta_pixel_id: string | null
          meta_view_event: string | null
          release_date: string | null
          slug: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artist_name: string
          artwork_url?: string | null
          created_at?: string | null
          email_capture_description?: string | null
          email_capture_enabled?: boolean | null
          email_capture_title?: string | null
          id?: string
          meta_click_event?: string | null
          meta_pixel_id?: string | null
          meta_view_event?: string | null
          release_date?: string | null
          slug?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artist_name?: string
          artwork_url?: string | null
          created_at?: string | null
          email_capture_description?: string | null
          email_capture_enabled?: boolean | null
          email_capture_title?: string | null
          id?: string
          meta_click_event?: string | null
          meta_pixel_id?: string | null
          meta_view_event?: string | null
          release_date?: string | null
          slug?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_links_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      app_role: "admin" | "user"
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

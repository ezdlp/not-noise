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
          id: string
          music_genre: string
          name: string
          updated_at: string | null
        }
        Insert: {
          artist_name: string
          country: string
          created_at?: string | null
          id: string
          music_genre: string
          name: string
          updated_at?: string | null
        }
        Update: {
          artist_name?: string
          country?: string
          created_at?: string | null
          id?: string
          music_genre?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      smart_links: {
        Row: {
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
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
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
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
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
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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

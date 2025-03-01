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
      business_data: {
        Row: {
          additional_data: Json | null
          address: string | null
          category: string | null
          city: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          name: string
          phone: string | null
          scraping_result_id: string | null
          state: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          additional_data?: Json | null
          address?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name: string
          phone?: string | null
          scraping_result_id?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          additional_data?: Json | null
          address?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name?: string
          phone?: string | null
          scraping_result_id?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_data_scraping_result_id_fkey"
            columns: ["scraping_result_id"]
            isOneToOne: false
            referencedRelation: "scraping_results"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_configs: {
        Row: {
          created_at: string | null
          id: string
          instructions: string
          model: string
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructions: string
          model: string
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instructions?: string
          model?: string
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scrape_configs: {
        Row: {
          created_at: string | null
          data_fields: string[] | null
          id: string
          industry: string | null
          location_city: string | null
          location_state: string | null
          selectors: Json | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          data_fields?: string[] | null
          id?: string
          industry?: string | null
          location_city?: string | null
          location_state?: string | null
          selectors?: Json | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          data_fields?: string[] | null
          id?: string
          industry?: string | null
          location_city?: string | null
          location_state?: string | null
          selectors?: Json | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      scraping_results: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          processed_data: Json | null
          processing_config_id: string | null
          raw_data: Json | null
          scrape_config_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          processed_data?: Json | null
          processing_config_id?: string | null
          raw_data?: Json | null
          scrape_config_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          processed_data?: Json | null
          processing_config_id?: string | null
          raw_data?: Json | null
          scrape_config_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scraping_results_processing_config_id_fkey"
            columns: ["processing_config_id"]
            isOneToOne: false
            referencedRelation: "processing_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scraping_results_scrape_config_id_fkey"
            columns: ["scrape_config_id"]
            isOneToOne: false
            referencedRelation: "scrape_configs"
            referencedColumns: ["id"]
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

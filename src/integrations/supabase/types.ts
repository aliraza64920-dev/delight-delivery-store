export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address: string
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          phone: string
          postal_code: string | null
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          postal_code?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          postal_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      city_rates: {
        Row: {
          available: boolean
          city: string
          fee: number
          id: string
        }
        Insert: {
          available?: boolean
          city: string
          fee: number
          id?: string
        }
        Update: {
          available?: boolean
          city?: string
          fee?: number
          id?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          email: string | null
          id: string
          order_id: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          email?: string | null
          id?: string
          order_id: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          email?: string | null
          id?: string
          order_id?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          assigned_email: string | null
          assigned_phone: string | null
          assigned_user_id: string | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          is_reward: boolean
          max_discount: number | null
          min_order: number
          per_customer_limit: number | null
          source_order_id: string | null
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          assigned_email?: string | null
          assigned_phone?: string | null
          assigned_user_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_reward?: boolean
          max_discount?: number | null
          min_order?: number
          per_customer_limit?: number | null
          source_order_id?: string | null
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          assigned_email?: string | null
          assigned_phone?: string | null
          assigned_user_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_reward?: boolean
          max_discount?: number | null
          min_order?: number
          per_customer_limit?: number | null
          source_order_id?: string | null
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          sku: string
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_labels: {
        Row: {
          courier: string | null
          courier_tracking: string | null
          download_count: number
          generated_at: string
          last_printed_at: string | null
          order_id: string
          print_count: number
        }
        Insert: {
          courier?: string | null
          courier_tracking?: string | null
          download_count?: number
          generated_at?: string
          last_printed_at?: string | null
          order_id: string
          print_count?: number
        }
        Update: {
          courier?: string | null
          courier_tracking?: string | null
          download_count?: number
          generated_at?: string
          last_printed_at?: string | null
          order_id?: string
          print_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_labels_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_token: string
          address: string
          city: string
          coupon_code: string | null
          created_at: string
          customer_name: string
          delivery_fee: number
          discount: number
          email: string
          id: string
          idempotency_key: string | null
          notes: string | null
          order_number: string
          payment_method: string
          payment_provider: string | null
          payment_reference: string | null
          payment_status: string
          phone: string
          postal_code: string | null
          status: string
          stock_deducted: boolean
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string
          address: string
          city: string
          coupon_code?: string | null
          created_at?: string
          customer_name: string
          delivery_fee: number
          discount?: number
          email: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number: string
          payment_method: string
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status: string
          phone: string
          postal_code?: string | null
          status?: string
          stock_deducted?: boolean
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string
          address?: string
          city?: string
          coupon_code?: string | null
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          discount?: number
          email?: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string
          phone?: string
          postal_code?: string | null
          status?: string
          stock_deducted?: boolean
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          age_range: string
          brand: string
          category: string
          color: string
          created_at: string
          description: string
          emoji: string
          id: string
          images: string[]
          is_active: boolean
          is_best_seller: boolean
          is_featured: boolean
          is_new: boolean
          keywords: string[]
          low_stock_threshold: number
          name: string
          popularity: number
          price: number
          rating: number
          review_count: number
          sale_price: number | null
          sku: string
          slug: string
          specifications: Json
          stock_quantity: number
          subcategory: string | null
          updated_at: string
          whats_included: string[]
        }
        Insert: {
          age_range: string
          brand: string
          category: string
          color?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          images?: string[]
          is_active?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new?: boolean
          keywords?: string[]
          low_stock_threshold?: number
          name: string
          popularity?: number
          price: number
          rating?: number
          review_count?: number
          sale_price?: number | null
          sku: string
          slug: string
          specifications?: Json
          stock_quantity?: number
          subcategory?: string | null
          updated_at?: string
          whats_included?: string[]
        }
        Update: {
          age_range?: string
          brand?: string
          category?: string
          color?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          images?: string[]
          is_active?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new?: boolean
          keywords?: string[]
          low_stock_threshold?: number
          name?: string
          popularity?: number
          price?: number
          rating?: number
          review_count?: number
          sale_price?: number | null
          sku?: string
          slug?: string
          specifications?: Json
          stock_quantity?: number
          subcategory?: string | null
          updated_at?: string
          whats_included?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          cod_enabled: boolean
          cod_stock_policy: string
          delivery_enabled: boolean
          delivery_fee: number
          free_delivery_threshold: number | null
          id: number
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          cod_enabled?: boolean
          cod_stock_policy?: string
          delivery_enabled?: boolean
          delivery_fee?: number
          free_delivery_threshold?: number | null
          id?: number
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          cod_enabled?: boolean
          cod_stock_policy?: string
          delivery_enabled?: boolean
          delivery_fee?: number
          free_delivery_threshold?: number | null
          id?: number
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_order_stock: { Args: { _order_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_coupon: { Args: { _coupon_id: string }; Returns: boolean }
      restore_order_stock: { Args: { _order_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const

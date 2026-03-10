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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_key: string
          created_at: string
          current_balance: number
          daily_loss_limit: number | null
          id: string
          initial_balance: number
          last_reset_date: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_key: string
          created_at?: string
          current_balance?: number
          daily_loss_limit?: number | null
          id?: string
          initial_balance?: number
          last_reset_date?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_key?: string
          created_at?: string
          current_balance?: number
          daily_loss_limit?: number | null
          id?: string
          initial_balance?: number
          last_reset_date?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analyses: {
        Row: {
          account_key: string
          asset: string | null
          created_at: string
          date: string | null
          fibonacci_level: string | null
          id: string
          image_url1: string | null
          image_url2: string | null
          image_url3: string | null
          liquidity_zone: string | null
          notes: string | null
          order_block_level: string | null
          status: string | null
          timeframe: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_key: string
          asset?: string | null
          created_at?: string
          date?: string | null
          fibonacci_level?: string | null
          id?: string
          image_url1?: string | null
          image_url2?: string | null
          image_url3?: string | null
          liquidity_zone?: string | null
          notes?: string | null
          order_block_level?: string | null
          status?: string | null
          timeframe?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_key?: string
          asset?: string | null
          created_at?: string
          date?: string | null
          fibonacci_level?: string | null
          id?: string
          image_url1?: string | null
          image_url2?: string | null
          image_url3?: string | null
          liquidity_zone?: string | null
          notes?: string | null
          order_block_level?: string | null
          status?: string | null
          timeframe?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calculation_history: {
        Row: {
          asset: string | null
          capital: number | null
          created_at: string
          current_price: number | null
          id: string
          pips_at_risk: number | null
          pips_potential_profit: number | null
          position_size: number | null
          risk_type: string | null
          rr_ratio: number | null
          stop_loss: number | null
          take_profit_value: number | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          asset?: string | null
          capital?: number | null
          created_at?: string
          current_price?: number | null
          id?: string
          pips_at_risk?: number | null
          pips_potential_profit?: number | null
          position_size?: number | null
          risk_type?: string | null
          rr_ratio?: number | null
          stop_loss?: number | null
          take_profit_value?: number | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          asset?: string | null
          capital?: number | null
          created_at?: string
          current_price?: number | null
          id?: string
          pips_at_risk?: number | null
          pips_potential_profit?: number | null
          position_size?: number | null
          risk_type?: string | null
          rr_ratio?: number | null
          stop_loss?: number | null
          take_profit_value?: number | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      custom_checklists: {
        Row: {
          checklist_group: string
          created_at: string
          id: string
          items: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist_group: string
          created_at?: string
          id?: string
          items?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist_group?: string
          created_at?: string
          id?: string
          items?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_validations: {
        Row: {
          account_key: string
          created_at: string
          date: string
          emotional_ready: string | null
          environment: boolean | null
          id: string
          mental_ready: string | null
          objective: boolean | null
          timer_started_at: string | null
          updated_at: string
          user_id: string
          validated_at: string | null
        }
        Insert: {
          account_key: string
          created_at?: string
          date: string
          emotional_ready?: string | null
          environment?: boolean | null
          id?: string
          mental_ready?: string | null
          objective?: boolean | null
          timer_started_at?: string | null
          updated_at?: string
          user_id: string
          validated_at?: string | null
        }
        Update: {
          account_key?: string
          created_at?: string
          date?: string
          emotional_ready?: string | null
          environment?: boolean | null
          id?: string
          mental_ready?: string | null
          objective?: boolean | null
          timer_started_at?: string | null
          updated_at?: string
          user_id?: string
          validated_at?: string | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          account_key: string
          asset: string | null
          created_at: string
          date: string | null
          emotional: Json | null
          entry_price: string | null
          entry_time: string | null
          exit_price: string | null
          id: string
          is_favorite: boolean | null
          market_session: string | null
          money_result: number | null
          notes: string | null
          operational: Json | null
          post_trade_image: string | null
          pre_trade_image: string | null
          rational: Json | null
          result: string | null
          result_price: string | null
          risk_reward: number | null
          routine: Json | null
          session: string | null
          stop_loss: string | null
          take_profit: string | null
          trade_data: Json | null
          trading_image: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_key: string
          asset?: string | null
          created_at?: string
          date?: string | null
          emotional?: Json | null
          entry_price?: string | null
          entry_time?: string | null
          exit_price?: string | null
          id?: string
          is_favorite?: boolean | null
          market_session?: string | null
          money_result?: number | null
          notes?: string | null
          operational?: Json | null
          post_trade_image?: string | null
          pre_trade_image?: string | null
          rational?: Json | null
          result?: string | null
          result_price?: string | null
          risk_reward?: number | null
          routine?: Json | null
          session?: string | null
          stop_loss?: string | null
          take_profit?: string | null
          trade_data?: Json | null
          trading_image?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_key?: string
          asset?: string | null
          created_at?: string
          date?: string | null
          emotional?: Json | null
          entry_price?: string | null
          entry_time?: string | null
          exit_price?: string | null
          id?: string
          is_favorite?: boolean | null
          market_session?: string | null
          money_result?: number | null
          notes?: string | null
          operational?: Json | null
          post_trade_image?: string | null
          pre_trade_image?: string | null
          rational?: Json | null
          result?: string | null
          result_price?: string | null
          risk_reward?: number | null
          routine?: Json | null
          session?: string | null
          stop_loss?: string | null
          take_profit?: string | null
          trade_data?: Json | null
          trading_image?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_key: string
          amount: number
          capital_at_withdrawal: number
          created_at: string
          date: string
          id: string
          notes: string | null
          profit_percentage: number
          proof_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_key: string
          amount: number
          capital_at_withdrawal: number
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          profit_percentage?: number
          proof_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_key?: string
          amount?: number
          capital_at_withdrawal?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          profit_percentage?: number
          proof_url?: string | null
          updated_at?: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

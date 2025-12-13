export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: string;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          project_id: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          project_id: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: true;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      api_usage: {
        Row: {
          api_key_id: string;
          id: string;
          last_reset_at: string | null;
          month: number;
          project_id: string;
          request_count: number | null;
          updated_at: string | null;
          year: number;
        };
        Insert: {
          api_key_id: string;
          id?: string;
          last_reset_at?: string | null;
          month: number;
          project_id: string;
          request_count?: number | null;
          updated_at?: string | null;
          year: number;
        };
        Update: {
          api_key_id?: string;
          id?: string;
          last_reset_at?: string | null;
          month?: number;
          project_id?: string;
          request_count?: number | null;
          updated_at?: string | null;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'api_usage_api_key_id_fkey';
            columns: ['api_key_id'];
            isOneToOne: false;
            referencedRelation: 'api_keys';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'api_usage_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          project_id: string | null;
          resource_id: string | null;
          resource_type: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          project_id?: string | null;
          resource_id?: string | null;
          resource_type: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          project_id?: string | null;
          resource_id?: string | null;
          resource_type?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          plan: string | null;
          stripe_customer_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          plan?: string | null;
          stripe_customer_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          plan?: string | null;
          stripe_customer_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string | null;
          default_language: string | null;
          description: string | null;
          id: string;
          languages: string[] | null;
          name: string;
          owner_id: string;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          default_language?: string | null;
          description?: string | null;
          id?: string;
          languages?: string[] | null;
          name: string;
          owner_id: string;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          default_language?: string | null;
          description?: string | null;
          id?: string;
          languages?: string[] | null;
          name?: string;
          owner_id?: string;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          status: string | null;
          stripe_price_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          status?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          status?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          created_at: string | null;
          id: string;
          invited_at: string | null;
          invited_by: string | null;
          joined_at: string | null;
          project_id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          project_id: string;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          project_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_members_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      translation_history: {
        Row: {
          change_type: string;
          changed_at: string | null;
          changed_by: string | null;
          id: string;
          new_values: Json | null;
          previous_values: Json | null;
          translation_id: string;
        };
        Insert: {
          change_type: string;
          changed_at?: string | null;
          changed_by?: string | null;
          id?: string;
          new_values?: Json | null;
          previous_values?: Json | null;
          translation_id: string;
        };
        Update: {
          change_type?: string;
          changed_at?: string | null;
          changed_by?: string | null;
          id?: string;
          new_values?: Json | null;
          previous_values?: Json | null;
          translation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'translation_history_translation_id_fkey';
            columns: ['translation_id'];
            isOneToOne: false;
            referencedRelation: 'translations';
            referencedColumns: ['id'];
          },
        ];
      };
      translations: {
        Row: {
          context: string | null;
          created_at: string | null;
          id: string;
          key: string;
          project_id: string;
          updated_at: string | null;
          updated_by: string | null;
          values: Json | null;
        };
        Insert: {
          context?: string | null;
          created_at?: string | null;
          id?: string;
          key: string;
          project_id: string;
          updated_at?: string | null;
          updated_by?: string | null;
          values?: Json | null;
        };
        Update: {
          context?: string | null;
          created_at?: string | null;
          id?: string;
          key?: string;
          project_id?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          values?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'translations_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      webhook_deliveries: {
        Row: {
          attempt_number: number;
          delivered_at: string | null;
          duration_ms: number | null;
          error_message: string | null;
          id: string;
          response_body: string | null;
          status_code: number | null;
          webhook_event_id: string;
          webhook_id: string;
        };
        Insert: {
          attempt_number: number;
          delivered_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          response_body?: string | null;
          status_code?: number | null;
          webhook_event_id: string;
          webhook_id: string;
        };
        Update: {
          attempt_number?: number;
          delivered_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          response_body?: string | null;
          status_code?: number | null;
          webhook_event_id?: string;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_deliveries_webhook_event_id_fkey';
            columns: ['webhook_event_id'];
            isOneToOne: false;
            referencedRelation: 'webhook_events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'webhook_deliveries_webhook_id_fkey';
            columns: ['webhook_id'];
            isOneToOne: false;
            referencedRelation: 'webhooks';
            referencedColumns: ['id'];
          },
        ];
      };
      webhook_events: {
        Row: {
          attempt_count: number | null;
          created_at: string | null;
          delivered_at: string | null;
          event_type: string;
          id: string;
          max_attempts: number | null;
          next_retry_at: string | null;
          payload: Json;
          status: string | null;
          webhook_id: string;
        };
        Insert: {
          attempt_count?: number | null;
          created_at?: string | null;
          delivered_at?: string | null;
          event_type: string;
          id?: string;
          max_attempts?: number | null;
          next_retry_at?: string | null;
          payload: Json;
          status?: string | null;
          webhook_id: string;
        };
        Update: {
          attempt_count?: number | null;
          created_at?: string | null;
          delivered_at?: string | null;
          event_type?: string;
          id?: string;
          max_attempts?: number | null;
          next_retry_at?: string | null;
          payload?: Json;
          status?: string | null;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_events_webhook_id_fkey';
            columns: ['webhook_id'];
            isOneToOne: false;
            referencedRelation: 'webhooks';
            referencedColumns: ['id'];
          },
        ];
      };
      webhooks: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          events: string[];
          id: string;
          is_active: boolean | null;
          project_id: string;
          secret: string | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          events?: string[];
          id?: string;
          is_active?: boolean | null;
          project_id: string;
          secret?: string | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          events?: string[];
          id?: string;
          is_active?: boolean | null;
          project_id?: string;
          secret?: string | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'webhooks_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_random_username: { Args: never; Returns: string };
      get_project_api_usage: {
        Args: { project_uuid: string };
        Returns: number;
      };
      get_project_api_usage_by_month: {
        Args: {
          project_uuid: string;
          target_month: number;
          target_year: number;
        };
        Returns: number;
      };
      has_project_access: {
        Args: { project_uuid: string; required_role?: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

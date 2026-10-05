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
      candidate_history: {
        Row: {
          body: string | null
          candidate_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          meta: Json | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          candidate_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meta?: Json | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          candidate_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meta?: Json | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_history_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          add_method: string
          address: string | null
          birth_date: string
          citizenship: string
          created_at: string | null
          created_by: string | null
          email: string | null
          first_name: string
          gender: string
          has_no_middle_name: boolean | null
          id: string
          last_name: string
          middle_name: string | null
          phone: string
          recommended_by: string | null
          resume_link: string | null
          source: string
          status: string
          tags: string[] | null
          updated_at: string | null
          vacancy_id: string | null
        }
        Insert: {
          add_method: string
          address?: string | null
          birth_date: string
          citizenship: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name: string
          gender: string
          has_no_middle_name?: boolean | null
          id?: string
          last_name: string
          middle_name?: string | null
          phone: string
          recommended_by?: string | null
          resume_link?: string | null
          source: string
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          vacancy_id?: string | null
        }
        Update: {
          add_method?: string
          address?: string | null
          birth_date?: string
          citizenship?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string
          gender?: string
          has_no_middle_name?: boolean | null
          id?: string
          last_name?: string
          middle_name?: string | null
          phone?: string
          recommended_by?: string | null
          resume_link?: string | null
          source?: string
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          vacancy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      org_unit_managers: {
        Row: {
          email: string
          full_name: string
          id: string
          org_unit_id: string | null
          phone: string
        }
        Insert: {
          email: string
          full_name: string
          id?: string
          org_unit_id?: string | null
          phone: string
        }
        Update: {
          email?: string
          full_name?: string
          id?: string
          org_unit_id?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_unit_managers_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "org_units"
            referencedColumns: ["id"]
          },
        ]
      }
      org_units: {
        Row: {
          actual_location: string | null
          category: string | null
          cfo: string | null
          cluster: string | null
          cluster_director_email: string
          cluster_director_full_name: string
          created_at: string | null
          director_email: string
          director_full_name: string
          director_phone: string
          division: string | null
          hr_email: string | null
          hr_full_name: string | null
          hr_phone: string | null
          id: string
          interview_address: string
          macroregion: string | null
          name: string
          opened_at: string | null
          regional_office: string | null
          sap_id: string | null
          territory: string | null
          timezone: string | null
        }
        Insert: {
          actual_location?: string | null
          category?: string | null
          cfo?: string | null
          cluster?: string | null
          cluster_director_email: string
          cluster_director_full_name: string
          created_at?: string | null
          director_email: string
          director_full_name: string
          director_phone: string
          division?: string | null
          hr_email?: string | null
          hr_full_name?: string | null
          hr_phone?: string | null
          id?: string
          interview_address: string
          macroregion?: string | null
          name: string
          opened_at?: string | null
          regional_office?: string | null
          sap_id?: string | null
          territory?: string | null
          timezone?: string | null
        }
        Update: {
          actual_location?: string | null
          category?: string | null
          cfo?: string | null
          cluster?: string | null
          cluster_director_email?: string
          cluster_director_full_name?: string
          created_at?: string | null
          director_email?: string
          director_full_name?: string
          director_phone?: string
          division?: string | null
          hr_email?: string | null
          hr_full_name?: string | null
          hr_phone?: string | null
          id?: string
          interview_address?: string
          macroregion?: string | null
          name?: string
          opened_at?: string | null
          regional_office?: string | null
          sap_id?: string | null
          territory?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
          theme: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role: string
          theme?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
          theme?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          recipient: string
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          recipient: string
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          recipient?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      vacancies: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_open: boolean | null
          org_unit_id: string | null
          requirements: string | null
          responsibilities: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_open?: boolean | null
          org_unit_id?: string | null
          requirements?: string | null
          responsibilities?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_open?: boolean | null
          org_unit_id?: string | null
          requirements?: string | null
          responsibilities?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacancies_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "org_units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
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
    Enums: {},
  },
} as const

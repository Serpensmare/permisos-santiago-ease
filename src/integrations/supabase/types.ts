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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      comunas: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          created_at: string
          id: string
          label: string | null
          negocio_id: string | null
          nombre: string
          permiso_negocio_id: string | null
          tamaño_archivo: number | null
          tipo_archivo: string
          url_archivo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          negocio_id?: string | null
          nombre: string
          permiso_negocio_id?: string | null
          tamaño_archivo?: number | null
          tipo_archivo: string
          url_archivo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          negocio_id?: string | null
          nombre?: string
          permiso_negocio_id?: string | null
          tamaño_archivo?: number | null
          tipo_archivo?: string
          url_archivo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documentos_permiso_negocio"
            columns: ["permiso_negocio_id"]
            isOneToOne: false
            referencedRelation: "permisos_negocio"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios: {
        Row: {
          comuna_id: string
          created_at: string
          direccion: string
          id: string
          nombre: string
          rubro_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comuna_id: string
          created_at?: string
          direccion: string
          id?: string
          nombre: string
          rubro_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comuna_id?: string
          created_at?: string
          direccion?: string
          id?: string
          nombre?: string
          rubro_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocios_comuna_id_fkey"
            columns: ["comuna_id"]
            isOneToOne: false
            referencedRelation: "comunas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_rubro_id_fkey"
            columns: ["rubro_id"]
            isOneToOne: false
            referencedRelation: "rubros"
            referencedColumns: ["id"]
          },
        ]
      }
      permisos: {
        Row: {
          created_at: string
          descripcion: string | null
          es_obligatorio: boolean | null
          id: string
          nombre: string
          updated_at: string
          vigencia_meses: number | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          es_obligatorio?: boolean | null
          id?: string
          nombre: string
          updated_at?: string
          vigencia_meses?: number | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          es_obligatorio?: boolean | null
          id?: string
          nombre?: string
          updated_at?: string
          vigencia_meses?: number | null
        }
        Relationships: []
      }
      permisos_negocio: {
        Row: {
          created_at: string
          estado: string | null
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          negocio_id: string
          permiso_id: string
          proximo_paso: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          negocio_id: string
          permiso_id: string
          proximo_paso?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          negocio_id?: string
          permiso_id?: string
          proximo_paso?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permisos_negocio_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permisos_negocio_permiso_id_fkey"
            columns: ["permiso_id"]
            isOneToOne: false
            referencedRelation: "permisos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          alertas_activas: boolean | null
          created_at: string
          id: string
          nombre_completo: string | null
          telefono_whatsapp: string | null
          tipo_notificacion: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alertas_activas?: boolean | null
          created_at?: string
          id?: string
          nombre_completo?: string | null
          telefono_whatsapp?: string | null
          tipo_notificacion?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alertas_activas?: boolean | null
          created_at?: string
          id?: string
          nombre_completo?: string | null
          telefono_whatsapp?: string | null
          tipo_notificacion?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reglas_permisos: {
        Row: {
          created_at: string
          es_obligatorio: boolean | null
          id: string
          permiso_id: string
          rubro_id: string
        }
        Insert: {
          created_at?: string
          es_obligatorio?: boolean | null
          id?: string
          permiso_id: string
          rubro_id: string
        }
        Update: {
          created_at?: string
          es_obligatorio?: boolean | null
          id?: string
          permiso_id?: string
          rubro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reglas_permisos_permiso_id_fkey"
            columns: ["permiso_id"]
            isOneToOne: false
            referencedRelation: "permisos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reglas_permisos_rubro_id_fkey"
            columns: ["rubro_id"]
            isOneToOne: false
            referencedRelation: "rubros"
            referencedColumns: ["id"]
          },
        ]
      }
      rubros: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
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

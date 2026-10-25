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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      gastos_operacion: {
        Row: {
          afecto_igv: boolean
          categoria: Database["public"]["Enums"]["categoria_gasto"]
          concepto: string
          id: string
          metodo: Database["public"]["Enums"]["metodo_prorrateo"]
          monto: number
          notas: string | null
          operacion_id: string
          organizacion_id: string
          posicion: number
        }
        Insert: {
          afecto_igv?: boolean
          categoria?: Database["public"]["Enums"]["categoria_gasto"]
          concepto: string
          id: string
          metodo?: Database["public"]["Enums"]["metodo_prorrateo"]
          monto?: number
          notas?: string | null
          operacion_id: string
          organizacion_id: string
          posicion?: number
        }
        Update: {
          afecto_igv?: boolean
          categoria?: Database["public"]["Enums"]["categoria_gasto"]
          concepto?: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_prorrateo"]
          monto?: number
          notas?: string | null
          operacion_id?: string
          organizacion_id?: string
          posicion?: number
        }
        Relationships: [
          {
            foreignKeyName: "gastos_operacion_operacion_id_organizacion_id_fkey"
            columns: ["operacion_id", "organizacion_id"]
            isOneToOne: false
            referencedRelation: "operaciones_importacion"
            referencedColumns: ["id", "organizacion_id"]
          },
        ]
      }
      importadores: {
        Row: {
          created_at: string
          id: string
          organizacion_id: string
          razon_social: string
          ruc: string
          tasa_percepcion_default: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizacion_id: string
          razon_social: string
          ruc: string
          tasa_percepcion_default?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organizacion_id?: string
          razon_social?: string
          ruc?: string
          tasa_percepcion_default?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "importadores_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      items_operacion: {
        Row: {
          cantidad: number
          costo_unitario_pen: number | null
          costo_unitario_usd: number | null
          descripcion: string
          fob_unitario: number
          id: string
          margen: number | null
          operacion_id: string
          organizacion_id: string
          part_number: string
          partida_arancelaria: string | null
          peso_kg_unitario: number
          posicion: number
          producto_id: string | null
          tasa_ad_valorem: number
          tasa_isc: number
          unidad: string
          volumen_m3_unitario: number
        }
        Insert: {
          cantidad: number
          costo_unitario_pen?: number | null
          costo_unitario_usd?: number | null
          descripcion?: string
          fob_unitario: number
          id: string
          margen?: number | null
          operacion_id: string
          organizacion_id: string
          part_number?: string
          partida_arancelaria?: string | null
          peso_kg_unitario?: number
          posicion: number
          producto_id?: string | null
          tasa_ad_valorem?: number
          tasa_isc?: number
          unidad?: string
          volumen_m3_unitario?: number
        }
        Update: {
          cantidad?: number
          costo_unitario_pen?: number | null
          costo_unitario_usd?: number | null
          descripcion?: string
          fob_unitario?: number
          id?: string
          margen?: number | null
          operacion_id?: string
          organizacion_id?: string
          part_number?: string
          partida_arancelaria?: string | null
          peso_kg_unitario?: number
          posicion?: number
          producto_id?: string | null
          tasa_ad_valorem?: number
          tasa_isc?: number
          unidad?: string
          volumen_m3_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_operacion_operacion_id_organizacion_id_fkey"
            columns: ["operacion_id", "organizacion_id"]
            isOneToOne: false
            referencedRelation: "operaciones_importacion"
            referencedColumns: ["id", "organizacion_id"]
          },
          {
            foreignKeyName: "items_operacion_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      miembros_organizacion: {
        Row: {
          created_at: string
          organizacion_id: string
          rol: Database["public"]["Enums"]["rol_organizacion"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organizacion_id: string
          rol?: Database["public"]["Enums"]["rol_organizacion"]
          user_id: string
        }
        Update: {
          created_at?: string
          organizacion_id?: string
          rol?: Database["public"]["Enums"]["rol_organizacion"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "miembros_organizacion_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      operaciones_importacion: {
        Row: {
          agente_aduanas: string | null
          agente_calculo_automatico: boolean
          agente_minimo_pen: number
          agente_tasa_comision: number
          calculado_at: string | null
          canal_control: Database["public"]["Enums"]["canal_control"] | null
          created_at: string
          created_by: string
          estado: Database["public"]["Enums"]["estado_operacion"]
          fecha_numeracion: string | null
          flete_internacional: number
          id: string
          importador_id: string | null
          importador_razon_social: string | null
          importador_ruc: string | null
          incoterm: Database["public"]["Enums"]["incoterm"]
          margen_global: number
          metodo_prorrateo_flete: Database["public"]["Enums"]["metodo_prorrateo"]
          nombre: string
          numero_dam: string | null
          organizacion_id: string
          pais_origen: string | null
          proveedor_id: string | null
          proveedor_nombre: string | null
          puerto_destino: string | null
          puerto_embarque: string | null
          recupera_credito_fiscal: boolean
          redondeo_sunat: boolean
          resultado: Json | null
          seguro_modo: Database["public"]["Enums"]["modo_seguro"]
          seguro_prima_neta: number
          seguro_tasa_deducible: number
          seguro_tasa_derecho_emision: number
          seguro_tasa_prima: number
          tasa_igv: number
          tasa_igv_servicios: number
          tasa_ipm: number
          tasa_percepcion: number
          tipo_cambio: number
          updated_at: string
          via_transporte: Database["public"]["Enums"]["via_transporte"]
        }
        Insert: {
          agente_aduanas?: string | null
          agente_calculo_automatico?: boolean
          agente_minimo_pen?: number
          agente_tasa_comision?: number
          calculado_at?: string | null
          canal_control?: Database["public"]["Enums"]["canal_control"] | null
          created_at?: string
          created_by?: string
          estado?: Database["public"]["Enums"]["estado_operacion"]
          fecha_numeracion?: string | null
          flete_internacional?: number
          id?: string
          importador_id?: string | null
          importador_razon_social?: string | null
          importador_ruc?: string | null
          incoterm?: Database["public"]["Enums"]["incoterm"]
          margen_global?: number
          metodo_prorrateo_flete?: Database["public"]["Enums"]["metodo_prorrateo"]
          nombre: string
          numero_dam?: string | null
          organizacion_id: string
          pais_origen?: string | null
          proveedor_id?: string | null
          proveedor_nombre?: string | null
          puerto_destino?: string | null
          puerto_embarque?: string | null
          recupera_credito_fiscal?: boolean
          redondeo_sunat?: boolean
          resultado?: Json | null
          seguro_modo?: Database["public"]["Enums"]["modo_seguro"]
          seguro_prima_neta?: number
          seguro_tasa_deducible?: number
          seguro_tasa_derecho_emision?: number
          seguro_tasa_prima?: number
          tasa_igv?: number
          tasa_igv_servicios?: number
          tasa_ipm?: number
          tasa_percepcion?: number
          tipo_cambio: number
          updated_at?: string
          via_transporte?: Database["public"]["Enums"]["via_transporte"]
        }
        Update: {
          agente_aduanas?: string | null
          agente_calculo_automatico?: boolean
          agente_minimo_pen?: number
          agente_tasa_comision?: number
          calculado_at?: string | null
          canal_control?: Database["public"]["Enums"]["canal_control"] | null
          created_at?: string
          created_by?: string
          estado?: Database["public"]["Enums"]["estado_operacion"]
          fecha_numeracion?: string | null
          flete_internacional?: number
          id?: string
          importador_id?: string | null
          importador_razon_social?: string | null
          importador_ruc?: string | null
          incoterm?: Database["public"]["Enums"]["incoterm"]
          margen_global?: number
          metodo_prorrateo_flete?: Database["public"]["Enums"]["metodo_prorrateo"]
          nombre?: string
          numero_dam?: string | null
          organizacion_id?: string
          pais_origen?: string | null
          proveedor_id?: string | null
          proveedor_nombre?: string | null
          puerto_destino?: string | null
          puerto_embarque?: string | null
          recupera_credito_fiscal?: boolean
          redondeo_sunat?: boolean
          resultado?: Json | null
          seguro_modo?: Database["public"]["Enums"]["modo_seguro"]
          seguro_prima_neta?: number
          seguro_tasa_deducible?: number
          seguro_tasa_derecho_emision?: number
          seguro_tasa_prima?: number
          tasa_igv?: number
          tasa_igv_servicios?: number
          tasa_ipm?: number
          tasa_percepcion?: number
          tipo_cambio?: number
          updated_at?: string
          via_transporte?: Database["public"]["Enums"]["via_transporte"]
        }
        Relationships: [
          {
            foreignKeyName: "operaciones_importacion_importador_id_fkey"
            columns: ["importador_id"]
            isOneToOne: false
            referencedRelation: "importadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operaciones_importacion_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operaciones_importacion_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      organizaciones: {
        Row: {
          created_at: string
          created_by: string
          id: string
          nombre: string
          plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          nombre: string
          plan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          nombre?: string
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          created_at: string
          descripcion: string
          id: string
          organizacion_id: string
          part_number: string
          partida_arancelaria: string | null
          peso_kg_unitario: number
          tasa_ad_valorem: number
          tasa_isc: number
          unidad: string
          updated_at: string
          volumen_m3_unitario: number
        }
        Insert: {
          created_at?: string
          descripcion?: string
          id?: string
          organizacion_id: string
          part_number: string
          partida_arancelaria?: string | null
          peso_kg_unitario?: number
          tasa_ad_valorem?: number
          tasa_isc?: number
          unidad?: string
          updated_at?: string
          volumen_m3_unitario?: number
        }
        Update: {
          created_at?: string
          descripcion?: string
          id?: string
          organizacion_id?: string
          part_number?: string
          partida_arancelaria?: string | null
          peso_kg_unitario?: number
          tasa_ad_valorem?: number
          tasa_isc?: number
          unidad?: string
          updated_at?: string
          volumen_m3_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "productos_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          created_at: string
          id: string
          nombre: string
          organizacion_id: string
          pais: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          organizacion_id: string
          pais?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          organizacion_id?: string
          pais?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      historial_costos_producto: {
        Row: {
          cantidad: number | null
          costo_unitario_pen: number | null
          costo_unitario_usd: number | null
          descripcion: string | null
          factor_importacion: number | null
          fecha_numeracion: string | null
          fob_unitario: number | null
          numero_dam: string | null
          operacion: string | null
          operacion_id: string | null
          organizacion_id: string | null
          part_number: string | null
          proveedor_nombre: string | null
          tipo_cambio: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      guardar_operacion: {
        Args: { p_gastos: Json; p_items: Json; p_operacion: Json }
        Returns: string
      }
      ultimo_costo_por_part_number: {
        Args: {
          p_excluir_operacion?: string
          p_organizacion_id: string
          p_part_numbers: string[]
        }
        Returns: {
          costo_unitario_pen: number
          fecha: string
          numero_dam: string
          operacion: string
          part_number: string
        }[]
      }
    }
    Enums: {
      canal_control: "verde" | "naranja" | "rojo"
      categoria_gasto: "operador_logistico" | "administrativo" | "financiero"
      estado_operacion: "borrador" | "calculada" | "cerrada"
      incoterm: "EXW" | "FCA" | "FOB" | "CFR" | "CIF" | "DAP" | "DDP"
      metodo_prorrateo: "valor_fob" | "peso" | "volumen" | "unidades"
      modo_seguro: "monto" | "tasa"
      rol_organizacion: "owner" | "admin" | "editor" | "viewer"
      via_transporte: "maritima" | "aerea" | "terrestre"
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
      canal_control: ["verde", "naranja", "rojo"],
      categoria_gasto: ["operador_logistico", "administrativo", "financiero"],
      estado_operacion: ["borrador", "calculada", "cerrada"],
      incoterm: ["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"],
      metodo_prorrateo: ["valor_fob", "peso", "volumen", "unidades"],
      modo_seguro: ["monto", "tasa"],
      rol_organizacion: ["owner", "admin", "editor", "viewer"],
      via_transporte: ["maritima", "aerea", "terrestre"],
    },
  },
} as const

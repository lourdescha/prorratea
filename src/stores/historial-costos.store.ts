"use client";

import { create } from "zustand";
import { createClient } from "@/services/supabase/client";
import {
  normalizarPartNumber,
  obtenerUltimosCostos,
  type UltimoCosto,
} from "@/services/supabase/historial-costos.service";
import { obtenerOrganizacionActual } from "@/services/supabase/organizaciones.service";

interface HistorialCostosState {
  /** Por Part Number normalizado */
  ultimos: Record<string, UltimoCosto>;
  /** Evita repetir la consulta si no cambiaron los SKUs ni la operación */
  clave: string | null;
  cargar: (partNumbers: string[], excluirOperacion: string | null) => Promise<void>;
}

/**
 * Historial de costos por SKU: es un dato de apoyo. Si no hay sesión, la
 * migración no está aplicada o la consulta falla, la tabla simplemente no
 * muestra el indicador.
 */
export const useHistorialCostosStore = create<HistorialCostosState>()((set, get) => ({
  ultimos: {},
  clave: null,
  cargar: async (partNumbers, excluirOperacion) => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const unicos = [...new Set(partNumbers.map(normalizarPartNumber).filter(Boolean))].sort();
    const clave = `${excluirOperacion ?? ""}|${unicos.join(",")}`;
    if (unicos.length === 0 || get().clave === clave) return;
    set({ clave });

    try {
      const supabase = createClient();
      const actual = await obtenerOrganizacionActual(supabase);
      if (!actual?.organizacionId) return;
      const ultimos = await obtenerUltimosCostos(supabase, actual.organizacionId, unicos, excluirOperacion);
      if (get().clave === clave) set({ ultimos });
    } catch (e) {
      console.warn("[historial] No se pudo consultar el historial de costos:", e);
    }
  },
}));

export const useUltimoCosto = (partNumber: string) =>
  useHistorialCostosStore((s) => s.ultimos[normalizarPartNumber(partNumber)]);

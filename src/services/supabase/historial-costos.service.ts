import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type Cliente = SupabaseClient<Database>;

export interface UltimoCosto {
  costoUnitarioPen: number;
  fecha: string | null;
  operacion: string;
  numeroDam: string | null;
}

/** Misma normalización que la función SQL: "fc3457 " y "FC3457" son el mismo SKU. */
export const normalizarPartNumber = (pn: string) => pn.trim().toUpperCase();

/**
 * Último costo unitario (S/) de cada Part Number en compras anteriores de la
 * organización, excluyendo la operación que se está editando.
 */
export async function obtenerUltimosCostos(
  supabase: Cliente,
  organizacionId: string,
  partNumbers: string[],
  excluirOperacion: string | null,
): Promise<Record<string, UltimoCosto>> {
  const { data, error } = await supabase.rpc("ultimo_costo_por_part_number", {
    p_organizacion_id: organizacionId,
    p_part_numbers: partNumbers,
    ...(excluirOperacion ? { p_excluir_operacion: excluirOperacion } : {}),
  });
  if (error) throw error;
  return Object.fromEntries(
    data.map((r) => [
      r.part_number,
      {
        costoUnitarioPen: Number(r.costo_unitario_pen),
        fecha: r.fecha,
        operacion: r.operacion,
        numeroDam: r.numero_dam,
      },
    ]),
  );
}

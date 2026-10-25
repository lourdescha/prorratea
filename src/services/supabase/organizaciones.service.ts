import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type Cliente = SupabaseClient<Database>;

/** Organización del usuario con sesión (la primera a la que se unió), o null si aún no tiene. */
export async function obtenerOrganizacionActual(
  supabase: Cliente,
): Promise<{ userId: string; email: string; organizacionId: string | null } | null> {
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data: membresia, error } = await supabase
    .from("miembros_organizacion")
    .select("organizacion_id")
    .eq("user_id", userId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const email = typeof claims.claims.email === "string" ? claims.claims.email : "";
  return { userId, email, organizacionId: membresia?.organizacion_id ?? null };
}

/**
 * Devuelve la organización del usuario; si aún no pertenece a ninguna, crea una
 * (el trigger `organizaciones_agregar_owner` lo registra como owner).
 */
export async function obtenerOCrearOrganizacion(supabase: Cliente): Promise<string> {
  const actual = await obtenerOrganizacionActual(supabase);
  if (!actual) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
  if (actual.organizacionId) return actual.organizacionId;

  const { data: org, error } = await supabase
    .from("organizaciones")
    .insert({ nombre: actual.email ? `Organización de ${actual.email}` : "Mi organización" })
    .select("id")
    .single();
  if (error) throw error;
  return org.id;
}

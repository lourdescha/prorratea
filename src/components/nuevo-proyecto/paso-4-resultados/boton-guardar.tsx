"use client";

import { CheckIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/services/supabase/client";
import { guardarOperacion } from "@/services/supabase/operaciones.service";
import { obtenerOCrearOrganizacion } from "@/services/supabase/organizaciones.service";
import { selectResultado, useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";

/** Traduce los errores de Postgres/PostgREST a algo accionable para el usuario. */
function mensajeError(e: unknown): string {
  const err = e as { code?: string; message?: string };
  if (err.code === "23505") return "Ya existe otra operación con ese número de DAM.";
  if (err.code === "42501") return "No tienes permisos para editar en esta organización.";
  if (err.code === "23514") return "Algún valor está fuera de rango (revisa tasas y márgenes).";
  return err.message ?? "Error desconocido";
}

/** Persiste la operación completa (cabecera + SKUs + gastos) vía RPC `guardar_operacion`. */
export function BotonGuardar() {
  const estado = useNuevoProyectoStore((s) => s.estadoGuardado);
  const proyectoId = useNuevoProyectoStore((s) => s.proyectoId);

  const guardar = async () => {
    const store = useNuevoProyectoStore.getState();
    store.setEstadoGuardado("guardando");
    try {
      const supabase = createClient();
      const organizacionId = await obtenerOCrearOrganizacion(supabase);
      const id = store.proyectoId ?? crypto.randomUUID();
      await guardarOperacion(supabase, {
        id,
        organizacionId,
        datosGenerales: store.datosGenerales,
        config: store.config,
        items: store.itemIds.map((i) => store.items[i]),
        gastos: store.gastoIds.map((g) => store.gastos[g]),
        resultado: selectResultado(store),
      });
      store.setProyectoId(id);
      store.setEstadoGuardado("guardado");
      toast.success("Operación guardada");
    } catch (e) {
      store.setEstadoGuardado("error");
      toast.error("No se pudo guardar", { description: mensajeError(e) });
    }
  };

  return (
    <Button onClick={guardar} disabled={estado === "guardando"}>
      {estado === "guardando" ? (
        <Loader2Icon className="animate-spin" />
      ) : estado === "guardado" ? (
        <CheckIcon />
      ) : (
        <SaveIcon />
      )}
      {estado === "guardando" ? "Guardando…" : proyectoId ? "Guardar cambios" : "Guardar operación"}
    </Button>
  );
}

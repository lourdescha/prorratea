"use client";

import { CheckIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useHistorialLocalStore } from "@/stores/historial-local.store";
import { selectResultado, useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";

/**
 * Guarda la cotización en el historial de ESTE navegador (no en Supabase), para
 * que los alumnos que comparten la cuenta del taller no mezclen sus datos.
 */
export function BotonGuardar() {
  const estado = useNuevoProyectoStore((s) => s.estadoGuardado);
  const proyectoId = useNuevoProyectoStore((s) => s.proyectoId);

  const guardar = async () => {
    const store = useNuevoProyectoStore.getState();
    store.setEstadoGuardado("guardando");
    try {
      const id = store.proyectoId ?? crypto.randomUUID();
      const descartadas = useHistorialLocalStore.getState().guardar(
        {
          proyectoId: id,
          datosGenerales: store.datosGenerales,
          config: store.config,
          items: store.itemIds.map((i) => store.items[i]),
          gastos: store.gastoIds.map((g) => store.gastos[g]),
        },
        selectResultado(store),
      );
      store.setProyectoId(id);
      store.setEstadoGuardado("guardado");
      toast.success("Guardada en tu historial", {
        description:
          descartadas > 0
            ? `Se quitaron ${descartadas} cotizaciones antiguas para liberar espacio.`
            : "Solo se ve en este navegador.",
      });
    } catch (e) {
      store.setEstadoGuardado("error");
      toast.error("No se pudo guardar", { description: e instanceof Error ? e.message : undefined });
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

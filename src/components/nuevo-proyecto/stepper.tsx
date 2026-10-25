"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASOS, useNuevoProyectoStore, usePasoActual, type Paso } from "@/stores/nuevo-proyecto.store";

/** Barra de progreso del asistente. Se puede volver a cualquier paso ya visitado. */
export function Stepper() {
  const actual = usePasoActual();
  const irAPaso = useNuevoProyectoStore((s) => s.irAPaso);

  return (
    <nav aria-label="Progreso">
      <ol className="grid grid-cols-4 gap-2">
        {PASOS.map((paso) => {
          const completado = paso.id < actual;
          const activo = paso.id === actual;
          return (
            <li key={paso.id}>
              <button
                type="button"
                disabled={!completado}
                onClick={() => irAPaso(paso.id as Paso)}
                aria-current={activo ? "step" : undefined}
                className={cn(
                  "flex w-full flex-col gap-2 border-t-4 pt-3 text-left transition-colors",
                  activo && "border-brand",
                  completado && "border-brand/50 hover:border-brand",
                  !activo && !completado && "border-muted",
                )}
              >
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border text-[11px]",
                      (activo || completado) && "border-brand bg-brand text-brand-foreground",
                    )}
                  >
                    {completado ? <CheckIcon className="size-3" /> : paso.id}
                  </span>
                  <span className="hidden sm:inline">Paso {paso.id}</span>
                </span>
                <span className={cn("text-sm font-medium", activo ? "text-brand" : "text-muted-foreground")}>{paso.titulo}</span>
                <span className="hidden text-xs text-muted-foreground md:block">{paso.descripcion}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

"use client";

import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNuevoProyectoStore, usePasoActual, type Paso } from "@/stores/nuevo-proyecto.store";
import { validarPaso } from "@/stores/validacion-pasos";

/** Atrás / Siguiente. Valida el paso actual antes de avanzar. */
export function NavegacionPasos() {
  const paso = usePasoActual();
  const irAPaso = useNuevoProyectoStore((s) => s.irAPaso);
  const [errores, setErrores] = useState<string[]>([]);

  const siguiente = () => {
    const e = validarPaso(paso, useNuevoProyectoStore.getState());
    setErrores(e);
    if (e.length === 0) {
      irAPaso((paso + 1) as Paso);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-3">
      {errores.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc pl-4">
              {errores.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          disabled={paso === 1}
          onClick={() => {
            setErrores([]);
            irAPaso((paso - 1) as Paso);
          }}
        >
          <ArrowLeftIcon /> Atrás
        </Button>
        {paso < 4 && (
          <Button onClick={siguiente}>
            {paso === 3 ? "Ver resultados" : "Siguiente"} <ArrowRightIcon />
          </Button>
        )}
      </div>
    </div>
  );
}

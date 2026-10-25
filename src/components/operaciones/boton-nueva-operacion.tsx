"use client";

import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";
import { confirmarDescartarBorrador } from "./confirmar-descarte";

/** Empieza una operación en blanco; pide confirmar si el borrador tiene cambios sin guardar. */
export function BotonNuevaOperacion() {
  const router = useRouter();

  const nueva = async () => {
    if (!(await confirmarDescartarBorrador())) return;
    useNuevoProyectoStore.getState().reset();
    router.push("/proyectos/nuevo");
  };

  return (
    <Button onClick={nueva}>
      <PlusIcon /> Nueva operación
    </Button>
  );
}

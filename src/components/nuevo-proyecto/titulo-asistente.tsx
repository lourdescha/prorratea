"use client";

import { useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";

export function TituloAsistente() {
  const editando = useNuevoProyectoStore((s) => s.proyectoId !== null);
  return (
    <h1 className="text-2xl font-semibold tracking-tight text-brand">
      {editando ? "Editar cotización" : "Nueva cotización de importación"}
    </h1>
  );
}

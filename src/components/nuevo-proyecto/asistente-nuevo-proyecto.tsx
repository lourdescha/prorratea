"use client";

import { useHidratarBorrador, usePasoActual } from "@/stores/nuevo-proyecto.store";
import { NavegacionPasos } from "./navegacion-pasos";
import { PasoDatosGenerales } from "./paso-1-datos-generales/paso-datos-generales";
import { PasoInventario } from "./paso-2-inventario/paso-inventario";
import { PasoGastosTributos } from "./paso-3-gastos-tributos/paso-gastos-tributos";
import { PasoResultados } from "./paso-4-resultados/paso-resultados";
import { ResumenVivo } from "./resumen-vivo";
import { Stepper } from "./stepper";

/** Raíz del asistente "Nuevo proyecto de importación". */
export function AsistenteNuevoProyecto() {
  useHidratarBorrador();
  const paso = usePasoActual();

  return (
    <div className="space-y-6">
      <Stepper />
      {paso > 1 && paso < 4 && <ResumenVivo />}
      {paso === 1 && <PasoDatosGenerales />}
      {paso === 2 && <PasoInventario />}
      {paso === 3 && <PasoGastosTributos />}
      {paso === 4 && <PasoResultados />}
      <NavegacionPasos />
    </div>
  );
}

"use client";

import { useResultado } from "@/stores/nuevo-proyecto.store";
import { factor, num, pen, usd } from "./formato";

/** Franja fija con los números que cambian mientras se edita (pasos 2 y 3). */
export function ResumenVivo() {
  const { totales, liquidacion } = useResultado();
  const datos = [
    { etiqueta: "SKUs", valor: num(totales.skus) },
    { etiqueta: "FOB", valor: usd(totales.fob) },
    { etiqueta: "CIF", valor: usd(liquidacion.cif) },
    { etiqueta: "Costo total", valor: pen(totales.costoTotalPen) },
    { etiqueta: "Factor", valor: factor(totales.factorImportacion) },
  ];
  return (
    <dl className="sticky top-0 z-10 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border bg-background/95 p-3 backdrop-blur sm:grid-cols-5">
      {datos.map((d) => (
        <div key={d.etiqueta}>
          <dt className="text-xs text-muted-foreground">{d.etiqueta}</dt>
          <dd className="font-semibold tabular-nums">{d.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

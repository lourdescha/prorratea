"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGastoIds, useNuevoProyectoStore, useResultado } from "@/stores/nuevo-proyecto.store";
import { usd } from "../formato";
import { FilaGasto } from "./fila-gasto";

/** Hoja "Gastos Importación": viene precargada con los conceptos habituales en 0. */
export function ListaGastos() {
  const gastoIds = useGastoIds();
  const agregarGasto = useNuevoProyectoStore((s) => s.agregarGasto);
  const { gastos } = useResultado();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>Gastos de importación</CardTitle>
          <CardDescription>
            Ingresa los montos SIN IGV (Subtotal). Si el comprobante tiene IGV, activa el botón para
            generar tu crédito fiscal.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => agregarGasto({ concepto: "Nuevo gasto" })}>
          <PlusIcon /> Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="hidden grid-cols-[1fr_140px_90px_36px] gap-2 px-1 text-xs text-muted-foreground sm:grid">
          <span>Concepto</span>
          <span className="text-right">Monto US$</span>
          <span className="text-center">Afecto IGV</span>
          <span />
        </div>
        {gastoIds.map((id) => (
          <FilaGasto key={id} id={id} />
        ))}
        <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Afectos</dt>
            <dd className="tabular-nums">{usd(gastos.afectos)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">No afectos</dt>
            <dd className="tabular-nums">{usd(gastos.noAfectos)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">IGV de gastos (crédito)</dt>
            <dd className="tabular-nums">{usd(gastos.igvGastos)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

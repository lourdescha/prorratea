"use client";

import { memo, useEffect } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ClasificacionMargen } from "@/core/costeo";
import { useHistorialCostosStore, useUltimoCosto } from "@/stores/historial-costos.store";
import { useItem, useItemIds, useNuevoProyectoStore, useResultadoItem } from "@/stores/nuevo-proyecto.store";
import { InputNumero } from "../campos";
import { factor, num, pen } from "../formato";

const BADGE: Record<ClasificacionMargen, { texto: string; variant: "success" | "secondary" | "destructive" }> = {
  alto: { texto: "Alto", variant: "success" },
  medio: { texto: "Medio", variant: "secondary" },
  bajo: { texto: "Bajo", variant: "destructive" },
};

/** Hojas "Costos x Producto" + "Precio de Venta" en una sola tabla. */
export function TablaCostosProducto() {
  const itemIds = useItemIds();
  const proyectoId = useNuevoProyectoStore((s) => s.proyectoId);
  const cargarHistorial = useHistorialCostosStore((s) => s.cargar);

  // Los Part Numbers solo cambian en el Paso 2: basta consultar al montar o al guardar.
  useEffect(() => {
    const { items } = useNuevoProyectoStore.getState();
    void cargarHistorial(itemIds.map((id) => items[id]?.partNumber ?? ""), proyectoId);
  }, [itemIds, proyectoId, cargarHistorial]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Costo y precio por SKU</CardTitle>
        <CardDescription>Ajusta el margen de un SKU y su precio se recalcula al instante.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs text-muted-foreground sm:hidden">Desliza la tabla hacia la izquierda para ver todas las columnas →</p>
        <div className="max-h-[60vh] overflow-auto rounded-md border">
          <Table className="min-w-[900px]">
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Factor</TableHead>
                <TableHead className="text-right">Costo unit. S/</TableHead>
                <TableHead className="w-24 text-right">Margen %</TableHead>
                <TableHead className="text-right">Precio c/IGV S/</TableHead>
                <TableHead className="text-right">Ganancia total S/</TableHead>
                <TableHead className="text-right">Equilibrio (u.)</TableHead>
                <TableHead>Margen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemIds.map((id) => (
                <FilaCosto key={id} id={id} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

const FilaCosto = memo(function FilaCosto({ id }: { id: string }) {
  const item = useItem(id);
  const r = useResultadoItem(id);
  const actualizar = useNuevoProyectoStore((s) => s.actualizarItem);
  if (!item || !r) return null;
  const badge = BADGE[r.clasificacion];

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{item.partNumber || "—"}</div>
        <div className="max-w-56 truncate text-xs text-muted-foreground">{item.descripcion}</div>
      </TableCell>
      <TableCell className="text-right tabular-nums">{num(item.cantidad)}</TableCell>
      <TableCell className="text-right tabular-nums">{factor(r.factorImportacion)}</TableCell>
      <TableCell className="text-right tabular-nums">
        <div>{pen(r.costoUnitarioPen)}</div>
        <ComparacionCompraAnterior partNumber={item.partNumber} costoActual={r.costoUnitarioPen} />
      </TableCell>
      <TableCell>
        <InputNumero aria-label="Margen" escala={100} valor={r.margen} onCambio={(v) => actualizar(id, { margen: v })} />
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">{pen(r.precioVentaConIgvPen)}</TableCell>
      <TableCell className="text-right tabular-nums">{pen(r.gananciaTotalPen)}</TableCell>
      <TableCell className="text-right tabular-nums">{num(r.puntoEquilibrioUnidades)}</TableCell>
      <TableCell>
        <Badge variant={badge.variant}>{badge.texto}</Badge>
      </TableCell>
    </TableRow>
  );
});

/** Una línea bajo el costo: cuánto cambió respecto a la última compra del mismo SKU. */
function ComparacionCompraAnterior({ partNumber, costoActual }: { partNumber: string; costoActual: number }) {
  const anterior = useUltimoCosto(partNumber);
  if (!anterior) return null;

  const diferencia = costoActual - anterior.costoUnitarioPen;
  const detalle = [anterior.numeroDam || anterior.operacion, anterior.fecha].filter(Boolean).join(" · ");

  if (Math.abs(diferencia) < 0.005) {
    return (
      <div className="text-xs whitespace-nowrap text-muted-foreground" title={detalle}>
        Igual que tu compra anterior
      </div>
    );
  }
  const subio = diferencia > 0;
  const Icono = subio ? ArrowUpIcon : ArrowDownIcon;
  return (
    <div
      className={`flex items-center justify-end gap-0.5 text-xs whitespace-nowrap ${
        subio ? "text-red-600 dark:text-red-400" : "text-success-foreground"
      }`}
      title={`Última vez: ${pen(anterior.costoUnitarioPen)}${detalle ? ` (${detalle})` : ""}`}
    >
      <Icono className="size-3" aria-hidden />
      {pen(Math.abs(diferencia))} {subio ? "más caro" : "más barato"}
      <span className="text-muted-foreground"> · antes {pen(anterior.costoUnitarioPen)}</span>
    </div>
  );
}

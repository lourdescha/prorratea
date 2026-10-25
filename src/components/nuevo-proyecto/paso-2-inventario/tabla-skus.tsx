"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useItemIds } from "@/stores/nuevo-proyecto.store";
import { FilaSku } from "./fila-sku";

/**
 * Cada fila se suscribe solo a su SKU: editar una no re-renderiza las otras 499.
 * Si con 500 filas se nota lento, virtualizar con @tanstack/react-virtual.
 */
export function TablaSkus() {
  const itemIds = useItemIds();

  if (itemIds.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aún no hay SKUs. Pega tu factura o agrega uno a mano.
      </p>
    );
  }

  return (
    <>
      <p className="mb-2 text-xs text-muted-foreground sm:hidden">
        Desliza la tabla hacia la izquierda para ver todas las columnas →
      </p>
      <div className="max-h-[60vh] overflow-auto rounded-md border">
        <Table className="min-w-[960px]">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="w-32">Part number</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-24 text-right">Cantidad</TableHead>
              <TableHead className="w-28 text-right">FOB unit. US$</TableHead>
              <TableHead className="w-20 text-right">ADV %</TableHead>
              <TableHead className="w-28 text-right">FOB total</TableHead>
              <TableHead className="w-28 text-right">Costo unit. S/</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemIds.map((id, i) => (
              <FilaSku key={id} id={id} indice={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

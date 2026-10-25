"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MAX_SKUS, useItemIds, useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";
import { PegarDesdeExcel } from "./pegar-desde-excel";
import { TablaSkus } from "./tabla-skus";

export function PasoInventario() {
  const itemIds = useItemIds();
  const agregarItem = useNuevoProyectoStore((s) => s.agregarItem);

  return (
    <div className="space-y-6">
      <PegarDesdeExcel />
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Factura comercial</CardTitle>
            <CardDescription>
              {itemIds.length} de {MAX_SKUS} SKUs. El costo unitario se recalcula al instante.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled={itemIds.length >= MAX_SKUS} onClick={() => agregarItem()}>
            <PlusIcon /> Agregar SKU
          </Button>
        </CardHeader>
        <CardContent>
          <TablaSkus />
        </CardContent>
      </Card>
    </div>
  );
}

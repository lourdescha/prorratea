"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfig, useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";
import { BotonDescargarPdf } from "./boton-descargar-pdf";
import { BotonGuardar } from "./boton-guardar";
import { ComposicionCostoChart } from "./composicion-costo-chart";
import { CostoVsPrecioChart } from "./costo-vs-precio-chart";
import { CreditoFiscalCard } from "./credito-fiscal-card";
import { KpisOperacion } from "./kpis-operacion";
import { TablaCostosProducto } from "./tabla-costos-producto";

type Pestana = "resumen" | "skus" | "credito";

export function PasoResultados() {
  const nombre = useNuevoProyectoStore((s) => s.datosGenerales.nombre);
  const { tipoCambio } = useConfig();
  const [pestana, setPestana] = useState<Pestana>("resumen");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-brand">{nombre || "Operación sin nombre"}</h2>
          <Badge variant="outline" className="h-7 px-3 text-sm tabular-nums">
            Tipo de cambio: S/ {tipoCambio.toFixed(3)} por US$ 1
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotonDescargarPdf />
          <BotonGuardar />
        </div>
      </div>

      <Tabs value={pestana} onValueChange={(v) => setPestana(v as Pestana)} className="gap-4">
        {/* En móvil las pestañas quedan en una sola fila deslizable */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <TabsList className="h-auto">
            <TabsTrigger value="resumen" className="flex-none px-3 py-1.5">Resumen e Inversión</TabsTrigger>
            <TabsTrigger value="skus" className="flex-none px-3 py-1.5">Costo y Precios por SKU</TabsTrigger>
            <TabsTrigger value="credito" className="flex-none px-3 py-1.5">Crédito Fiscal</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="resumen" className="space-y-6">
          <KpisOperacion />
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <ComposicionCostoChart />
            <CostoVsPrecioChart />
          </div>
        </TabsContent>

        <TabsContent value="skus">
          <TablaCostosProducto />
        </TabsContent>

        <TabsContent value="credito">
          <CreditoFiscalCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

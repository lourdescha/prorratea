"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useNuevoProyectoStore, useResultado } from "@/stores/nuevo-proyecto.store";
import { num, pct, pen } from "../formato";
import { filaTooltip } from "./tooltip-grafico";

const TOP_SKUS = 8;

const config = {
  costo: { label: "Costo unitario", color: "var(--chart-1)" },
  precio: { label: "Precio de venta (sin IGV)", color: "var(--chart-2)" },
} satisfies ChartConfig;

const recortar = (t: string, max = 18) => (t.length > max ? `${t.slice(0, max - 1)}…` : t);

/** Costo vs precio unitario de los SKUs que más venden (por ingreso total). */
export function CostoVsPrecioChart() {
  const { items: resultados } = useResultado();
  const items = useNuevoProyectoStore((s) => s.items);

  const datos = useMemo(
    () =>
      [...resultados]
        .sort((a, b) => b.ingresoTotalPen - a.ingresoTotalPen)
        .slice(0, TOP_SKUS)
        .map((r) => {
          const it = items[r.id];
          const nombre = it?.partNumber || it?.descripcion || "SKU sin nombre";
          return {
            sku: recortar(nombre),
            nombre,
            descripcion: it?.descripcion ?? "",
            costo: r.costoUnitarioPen,
            precio: r.valorVentaUnitarioPen,
            margen: r.margen,
          };
        }),
    [resultados, items],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Costo vs precio de venta</CardTitle>
        <CardDescription>
          Por unidad, en soles. Los {Math.min(TOP_SKUS, datos.length)} SKUs con mayor ingreso esperado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {datos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Agrega SKUs para ver la comparación.</p>
        ) : (
          <ChartContainer config={config} className="w-full" style={{ height: 80 + datos.length * 44 }}>
            <BarChart data={datos} layout="vertical" barGap={2} barCategoryGap="22%" margin={{ left: 4, right: 16 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <YAxis dataKey="sku" type="category" tickLine={false} axisLine={false} width={124} />
              <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `S/ ${num(Number(v))}`} />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.6 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_l, payload) => {
                      const d = payload?.[0]?.payload as (typeof datos)[number] | undefined;
                      return d ? `${d.nombre}${d.descripcion && d.descripcion !== d.nombre ? ` · ${d.descripcion}` : ""}` : "";
                    }}
                    formatter={(valor, nombre, item) => {
                      const clave = nombre as keyof typeof config;
                      const d = item.payload as (typeof datos)[number];
                      return filaTooltip(
                        config[clave].label,
                        config[clave].color,
                        pen(Number(valor)),
                        clave === "precio" ? `margen ${pct(d.margen)}` : undefined,
                      );
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
              <Bar dataKey="costo" fill="var(--color-costo)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              <Bar dataKey="precio" fill="var(--color-precio)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

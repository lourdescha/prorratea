"use client";

import { Label, Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useResultado } from "@/stores/nuevo-proyecto.store";
import { pct, usd } from "../formato";
import { filaTooltip } from "./tooltip-grafico";

// Orden fijo de la paleta: cada concepto conserva su color aunque su monto sea 0.
const config = {
  fob: { label: "FOB (mercadería)", color: "var(--chart-1)" },
  flete: { label: "Flete", color: "var(--chart-2)" },
  seguro: { label: "Seguro", color: "var(--chart-3)" },
  advalorem: { label: "Ad Valorem / ISC", color: "var(--chart-4)" },
  gastos: { label: "Gastos de importación", color: "var(--chart-5)" },
  // Solo aparece sin crédito fiscal (B2C): IGV, IPM y percepción pasan a ser costo
  tributos: { label: "IGV, IPM y percepción", color: "var(--chart-6)" },
} satisfies ChartConfig;

type Clave = keyof typeof config;

/** ¿De qué está hecho el costo puesto en almacén? (sin crédito fiscal, que no es costo) */
export function ComposicionCostoChart() {
  const { liquidacion: l, gastos, totales } = useResultado();
  const total = totales.costoTotal;
  const parcial = {
    fob: l.fob,
    flete: l.flete,
    seguro: l.primaNeta,
    advalorem: l.adValorem + l.isc,
    gastos: gastos.afectos + gastos.noAfectos,
  };
  const montos: Record<Clave, number> = {
    ...parcial,
    tributos: Math.max(0, total - Object.values(parcial).reduce((a, b) => a + b, 0)),
  };
  const datos = (Object.keys(config) as Clave[]).map((clave) => ({
    clave,
    monto: montos[clave],
    participacion: total ? montos[clave] / total : 0,
    fill: `var(--color-${clave})`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composición del costo de importación</CardTitle>
        <CardDescription>Qué parte del costo puesto en almacén aporta cada concepto.</CardDescription>
      </CardHeader>
      <CardContent className="grid items-center gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
        <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-[180px]">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="clave"
                  formatter={(valor, _n, item) => {
                    const d = item.payload as (typeof datos)[number];
                    return filaTooltip(config[d.clave].label, config[d.clave].color, usd(Number(valor)), pct(d.participacion));
                  }}
                />
              }
            />
            <Pie
              data={datos.filter((d) => d.monto > 0.005)}
              dataKey="monto"
              nameKey="clave"
              innerRadius="62%"
              outerRadius="100%"
              stroke="var(--card)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox)) return null;
                  const { cx, cy } = viewBox;
                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="pointer-events-none">
                      <tspan x={cx} y={(cy ?? 0) - 8} className="fill-muted-foreground text-xs">
                        Costo total
                      </tspan>
                      <tspan x={cx} y={(cy ?? 0) + 12} className="fill-foreground text-sm font-semibold">
                        {usd(total)}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Leyenda con valores: identifica cada color sin depender solo de él */}
        <ul className="min-w-0 space-y-2 text-sm">
          {datos.filter((d) => d.clave !== "tributos" || d.monto > 0.005).map((d) => (
            <li key={d.clave} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: config[d.clave].color }} />
              <span className="min-w-0 truncate text-muted-foreground">{config[d.clave].label}</span>
              <span className="ml-auto shrink-0 tabular-nums">{usd(d.monto)}</span>
              <span className="w-12 shrink-0 text-right text-muted-foreground tabular-nums">{pct(d.participacion)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

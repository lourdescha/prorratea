"use client";

import type { ParametrosSeguro } from "@/core/costeo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useConfig, useNuevoProyectoStore, useResultado } from "@/stores/nuevo-proyecto.store";
import { CampoNumero } from "../campos";
import { usd } from "../formato";

const MODOS_SEGURO: { valor: ParametrosSeguro["modo"]; etiqueta: string }[] = [
  { valor: "monto", etiqueta: "Monto manual (US$)" },
  { valor: "tasa", etiqueta: "Tasa de prima (%)" },
];

export function FleteSeguro() {
  const c = useConfig();
  const setConfig = useNuevoProyectoStore((s) => s.setConfig);
  const setSeguro = useNuevoProyectoStore((s) => s.setSeguro);
  const { liquidacion } = useResultado();

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Flete internacional</CardTitle>
          <CardDescription>Con el flete y el seguro se arma el valor CIF, base de los tributos.</CardDescription>
        </CardHeader>
        <CardContent>
          <CampoNumero
            etiqueta="Flete internacional (US$)"
            valor={c.fleteInternacional}
            onCambio={(v) => setConfig({ fleteInternacional: v })}
            ayuda="Del BL / AWB."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seguro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div role="radiogroup" aria-label="Forma de ingresar el seguro" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {MODOS_SEGURO.map((m) => (
              <button
                key={m.valor}
                type="button"
                role="radio"
                aria-checked={c.seguro.modo === m.valor}
                onClick={() => setSeguro({ modo: m.valor })}
                className={cn(
                  "rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  c.seguro.modo === m.valor
                    ? "bg-background font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.etiqueta}
              </button>
            ))}
          </div>
          {c.seguro.modo === "monto" ? (
            <CampoNumero
              etiqueta="Prima neta (US$)"
              valor={c.seguro.primaNeta}
              onCambio={(v) => setSeguro({ primaNeta: v })}
            />
          ) : (
            <CampoNumero
              etiqueta="Tasa de prima"
              valor={c.seguro.tasaPrima}
              escala={100}
              sufijo="%"
              onCambio={(v) => setSeguro({ tasaPrima: v })}
              ayuda={`Sobre el CFR. Prima = ${usd(liquidacion.primaNeta)}`}
            />
          )}
          <p className="text-xs text-muted-foreground">La póliza de seguro de importación no está afecta a IGV.</p>
        </CardContent>
      </Card>
    </div>
  );
}

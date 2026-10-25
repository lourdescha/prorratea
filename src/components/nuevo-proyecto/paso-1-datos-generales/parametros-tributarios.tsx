"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TASAS_PERCEPCION } from "@/core/costeo";
import { useConfig, useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";
import { CampoNumero, CampoSelect } from "../campos";

/** Lo que el Excel pide en "Parámetros tributarios", con valores por defecto de Perú. */
export function ParametrosTributarios() {
  const c = useConfig();
  const setConfig = useNuevoProyectoStore((s) => s.setConfig);
  const setTributos = useNuevoProyectoStore((s) => s.setTributos);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil tributario</CardTitle>
        <CardDescription>Ya vienen los valores vigentes para Perú. Cámbialos solo si tu caso es distinto.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <CampoSelect
          etiqueta="Percepción del IGV"
          valor={String(c.tributos.tasaPercepcion)}
          opciones={TASAS_PERCEPCION.map((t) => ({ valor: String(t.tasa), etiqueta: t.etiqueta }))}
          onCambio={(v) => setTributos({ tasaPercepcion: Number(v) })}
        />
        <CampoNumero
          etiqueta="Margen de utilidad global"
          valor={c.margenGlobal}
          escala={100}
          sufijo="%"
          onCambio={(v) => setConfig({ margenGlobal: v })}
          ayuda="Sobre el precio de venta. Lo puedes cambiar por SKU."
        />
        <div className="flex items-start justify-between gap-4 rounded-lg border p-3 sm:col-span-2">
          <div className="space-y-1">
            <Label htmlFor="recupera-cf">Recupero el crédito fiscal (tengo RUC y vendo con factura)</Label>
            <p className="text-xs text-muted-foreground">
              Si está activo, el IGV, IPM y la percepción no suman al costo: los recuperas al vender. Desactívalo si importas como persona natural.
            </p>
          </div>
          <Switch
            id="recupera-cf"
            checked={c.recuperaCreditoFiscal}
            onCheckedChange={(v) => setConfig({ recuperaCreditoFiscal: v })}
          />
        </div>
        <details className="sm:col-span-2">
          <summary className="cursor-pointer text-sm text-muted-foreground">Tasas avanzadas (IGV, IPM, IGV de servicios)</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <CampoNumero etiqueta="IGV importación" valor={c.tributos.tasaIgv} escala={100} sufijo="%" onCambio={(v) => setTributos({ tasaIgv: v })} />
            <CampoNumero etiqueta="IPM" valor={c.tributos.tasaIpm} escala={100} sufijo="%" onCambio={(v) => setTributos({ tasaIpm: v })} />
            <CampoNumero etiqueta="IGV servicios / ventas" valor={c.tributos.tasaIgvServicios} escala={100} sufijo="%" onCambio={(v) => setTributos({ tasaIgvServicios: v })} />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

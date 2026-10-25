"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useResultado } from "@/stores/nuevo-proyecto.store";
import { usd } from "../formato";

function Fila({ k, v, fuerte }: { k: string; v: number; fuerte?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${fuerte ? "font-semibold" : ""}`}>
      <span className={fuerte ? "" : "text-muted-foreground"}>{k}</span>
      <span className="tabular-nums">{usd(v)}</span>
    </div>
  );
}

/** Hoja "Tributos Aduana": se calcula sola, en vivo. */
export function LiquidacionAduana() {
  const { liquidacion: l } = useResultado();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liquidación aduanera</CardTitle>
        <CardDescription>Así lo calcula SUNAT. Se actualiza mientras escribes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Fila k="FOB" v={l.fob} />
        <Fila k="+ Flete" v={l.flete} />
        <Fila k="= CFR" v={l.cfr} />
        <Fila k="+ Seguro (prima neta)" v={l.primaNeta} />
        <Fila k="= CIF (valor en aduanas)" v={l.cif} fuerte />
        <Separator />
        <Fila k="Ad Valorem" v={l.adValorem} />
        {l.isc > 0 && <Fila k="ISC" v={l.isc} />}
        <Fila k="IPM (2 %)" v={l.ipm} />
        <Fila k="IGV (16 %)" v={l.igv} />
        <Fila k="= Deuda aduanera" v={l.deudaAduanera} fuerte />
        <Fila k="+ Percepción" v={l.percepcion} />
        <Separator />
        <Fila k="Total a pagar a SUNAT" v={l.totalPagoSunat} fuerte />
        <p className="pt-2 text-xs text-muted-foreground">
          Solo el Ad Valorem es costo. El IGV, el IPM y la percepción son crédito fiscal.
        </p>
      </CardContent>
    </Card>
  );
}

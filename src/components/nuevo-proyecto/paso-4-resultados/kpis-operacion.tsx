"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfig, useResultado } from "@/stores/nuevo-proyecto.store";
import { factor, pct, pen, usd } from "../formato";

function Desglose({ filas }: { filas: { k: string; v: string }[] }) {
  return (
    <dl className="mt-3 space-y-1 border-t pt-3 text-xs">
      {filas.map((f) => (
        <div key={f.k} className="flex justify-between gap-2">
          <dt className="text-muted-foreground">{f.k}</dt>
          <dd className="tabular-nums">{f.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Capital requerido destacado + las 4 cifras que responden "¿cuánto me cuesta y cuánto gano?". */
export function KpisOperacion() {
  const { totales: t, liquidacion: l } = useResultado();
  const { tipoCambio: tc, recuperaCreditoFiscal } = useConfig();
  const anticipoRecuperable = t.capitalRequerido - t.costoTotal;
  const restoSunat = l.igv + l.ipm + l.percepcion;

  return (
    <div className="space-y-4">
      <Card className="bg-accent ring-brand/15">
        <CardHeader>
          <CardTitle className="text-brand">Inversión total · capital requerido</CardTitle>
          <CardDescription>Lo que debes tener en el banco para pagar y nacionalizar esta operación.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end sm:gap-10">
          <div>
            <p className="text-3xl font-bold tracking-tight text-brand tabular-nums sm:text-4xl">{pen(t.capitalRequeridoPen)}</p>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">{usd(t.capitalRequerido)}</p>
          </div>
          <dl className="grid gap-1 text-sm sm:max-w-md">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Costo total puesto en almacén</dt>
              <dd className="tabular-nums">{pen(t.costoTotalPen)}</dd>
            </div>
            {recuperaCreditoFiscal && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">+ IGV, IPM y percepción que adelantas</dt>
                <dd className="tabular-nums">{pen(anticipoRecuperable * tc)}</dd>
              </div>
            )}
            <p className="pt-1 text-xs text-muted-foreground">
              {recuperaCreditoFiscal
                ? "El Ad Valorem ya está dentro del costo; el resto lo recuperas como crédito fiscal."
                : "Sin crédito fiscal, todos los tributos ya son parte del costo."}
            </p>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi etiqueta="Costo total puesto en almacén" valor={pen(t.costoTotalPen)} detalle={usd(t.costoTotal)} />
        <Kpi
          etiqueta="Factor de importación"
          valor={factor(t.factorImportacion)}
          detalle="Por cada US$ 1 FOB pagas esto puesto en almacén"
        />
        <Kpi etiqueta="Pago total a SUNAT" valor={usd(l.totalPagoSunat)} detalle={pen(l.totalPagoSunat * tc)}>
          <Desglose
            filas={[
              { k: "Ad Valorem", v: usd(l.adValorem) },
              ...(l.isc > 0 ? [{ k: "ISC", v: usd(l.isc) }] : []),
              { k: "IGV + IPM + Percepción", v: usd(restoSunat) },
            ]}
          />
        </Kpi>
        <Kpi
          etiqueta="Utilidad bruta estimada"
          valor={pen(t.gananciaTotalPen)}
          detalle={`Margen real ${pct(t.margenReal)} sobre ${pen(t.ingresoTotalPen)}`}
        />
      </div>
    </div>
  );
}

function Kpi({
  etiqueta,
  valor,
  detalle,
  children,
}: {
  etiqueta: string;
  valor: string;
  detalle: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{etiqueta}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{valor}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>
        {children}
      </CardContent>
    </Card>
  );
}

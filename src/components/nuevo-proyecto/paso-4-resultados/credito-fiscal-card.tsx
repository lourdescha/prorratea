"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useConfig, useResultado } from "@/stores/nuevo-proyecto.store";
import { pen, usd } from "../formato";

export function CreditoFiscalCard() {
  const { creditoFiscal: cf } = useResultado();
  const { recuperaCreditoFiscal, tipoCambio: tc } = useConfig();
  const filas = [
    { k: "IGV aduanas", v: cf.igvAduanas, nota: "Pagado a SUNAT en la DAM" },
    { k: "IPM", v: cf.ipm, nota: "Pagado a SUNAT en la DAM" },
    { k: "Percepción", v: cf.percepcion, nota: "Se aplica contra el IGV por pagar del mes" },
    { k: "IGV de gastos", v: cf.igvGastos, nota: "Facturas de operadores y agente" },
  ];
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Crédito fiscal</CardTitle>
        <CardDescription>
          {recuperaCreditoFiscal
            ? "No es costo: lo adelantas al importar y lo recuperas al vender y cobrar IGV."
            : "Como no lo recuperas, ya está sumado al costo de cada SKU."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concepto</TableHead>
              <TableHead className="text-right">US$</TableHead>
              <TableHead className="text-right">S/</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f) => (
              <TableRow key={f.k}>
                <TableCell>
                  <div>{f.k}</div>
                  <div className="text-xs text-muted-foreground">{f.nota}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{usd(f.v)}</TableCell>
                <TableCell className="text-right tabular-nums">{pen(f.v * tc)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{usd(cf.total)}</TableCell>
              <TableCell className="text-right font-semibold text-success-foreground tabular-nums">{pen(cf.totalPen)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

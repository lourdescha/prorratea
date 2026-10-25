import { describe, expect, it } from "vitest";
import {
  calcularOperacion,
  calcularPrecioVenta,
  CONFIG_PERU,
  redondear,
  type ConfiguracionCosteo,
  type GastoImportacion,
  type ItemImportacion,
} from "@/core/costeo";
import excel from "./fixtures/excel-cci-2026-04.json";

/**
 * Reproduce la operación de ejemplo del Excel maestro (28 SKUs, DAM-2025-000001)
 * y exige los mismos resultados que calcula Excel.
 */
const p = excel.parametros;

const items: ItemImportacion[] = excel.items.map((it, i) => ({
  id: `sku-${i}`,
  partNumber: it.partNumber,
  descripcion: it.descripcion,
  unidad: it.unidad,
  cantidad: it.cantidad,
  fobUnitario: it.fobUnitario,
  partidaArancelaria: "",
  tasaAdValorem: p.tasaAdValorem,
  tasaIsc: 0,
  pesoKgUnitario: 0,
  volumenM3Unitario: 0,
  margen: null,
}));

// La comisión del agente es un gasto manual más (en el Excel: 164.38).
const gastos: GastoImportacion[] = excel.gastos.map((g, i) => ({
  id: `gasto-${i}`,
  concepto: g.concepto,
  categoria: "operador_logistico",
  monto: g.monto,
  afectoIgv: g.afectoIgv,
  metodo: "valor_fob",
}));

const config: ConfiguracionCosteo = {
  ...CONFIG_PERU,
  tipoCambio: p.tipoCambio,
  fleteInternacional: p.fleteInternacional,
  seguro: { ...CONFIG_PERU.seguro, modo: "monto", primaNeta: p.primaNeta },
  margenGlobal: p.margenGlobal,
};

const r = calcularOperacion({ items, gastos, config });
const e = excel.esperado;
// El Excel suma IGV al seguro; aquí la póliza es inafecta, así que sale del crédito fiscal.
const creditoFiscalSinIgvSeguro = e.creditoFiscal - e.igvSeguro;

describe("paridad con el Excel maestro", () => {
  it("liquidación aduanera", () => {
    expect(r.liquidacion.fob).toBeCloseTo(e.fob, 6);
    expect(r.liquidacion.cfr).toBeCloseTo(e.cfr, 6);
    expect(r.liquidacion.cif).toBeCloseTo(e.cif, 6);
    expect(r.liquidacion.adValorem).toBe(e.adValorem);
    expect(r.liquidacion.ipm).toBe(e.ipm);
    expect(r.liquidacion.igv).toBe(e.igv);
    expect(r.liquidacion.deudaAduanera).toBe(e.deudaAduanera);
    expect(r.liquidacion.percepcion).toBe(e.percepcion);
  });

  it("gastos y crédito fiscal", () => {
    expect(r.gastos.afectos).toBeCloseTo(e.gastosAfectos, 6);
    expect(r.gastos.noAfectos).toBeCloseTo(e.gastosNoAfectos, 6);
    expect(r.gastos.igvGastos).toBeCloseTo(e.igvGastos, 6);
    expect(r.creditoFiscal.total).toBeCloseTo(creditoFiscalSinIgvSeguro, 6);
  });

  it("costo total y factor de prorrateo", () => {
    expect(r.totales.costoTotal).toBeCloseTo(e.costoTotalUsd, 6);
    expect(r.totales.factorImportacion).toBeCloseTo(e.factor, 10);
  });

  it("costo unitario y precio de venta por SKU", () => {
    excel.items.forEach((it, i) => {
      const ri = r.items[i];
      expect(ri.costoUnitario).toBeCloseTo(it.esperado.costoUnitarioUsd, 9);
      expect(ri.costoUnitarioPen).toBeCloseTo(it.esperado.costoUnitarioPen, 9);
      expect(ri.valorVentaUnitarioPen).toBeCloseTo(it.esperado.valorVentaUnitarioPen, 9);
      expect(ri.precioVentaConIgvPen).toBeCloseTo(it.esperado.precioVentaConIgvPen, 9);
      expect(ri.gananciaUnitariaPen).toBeCloseTo(it.esperado.gananciaUnitariaPen, 9);
    });
  });

  it("la suma de lo prorrateado por SKU cuadra con los totales", () => {
    const suma = (k: "cif" | "adValorem" | "igv" | "percepcion" | "costoTotal") =>
      r.items.reduce((acc, it) => acc + it[k], 0);
    expect(suma("cif")).toBeCloseTo(r.liquidacion.cif, 6);
    expect(suma("adValorem")).toBeCloseTo(r.liquidacion.adValorem, 6);
    expect(suma("igv")).toBeCloseTo(r.liquidacion.igv, 6);
    expect(suma("percepcion")).toBeCloseTo(r.liquidacion.percepcion, 6);
    expect(suma("costoTotal")).toBeCloseTo(r.totales.costoTotal, 6);
  });
});

describe("reglas propias del SaaS (mejoras sobre el Excel)", () => {
  it("seguro inafecto: no genera IGV ni crédito fiscal, solo entra al CIF", () => {
    const sinSeguro = calcularOperacion({ items, gastos, config: { ...config, seguro: { ...config.seguro, primaNeta: 0 } } });
    expect(r.liquidacion.cif - sinSeguro.liquidacion.cif).toBeCloseTo(p.primaNeta, 9);
    expect(r.creditoFiscal.igvGastos).toBeCloseTo(sinSeguro.creditoFiscal.igvGastos, 9);
    expect(r.creditoFiscal.total - (r.liquidacion.ipm + r.liquidacion.igv + r.liquidacion.percepcion)).toBeCloseTo(
      r.gastos.igvGastos,
      9,
    );
  });

  it("seguro por tasa de prima = ROUND(CFR × tasa, 2)", () => {
    const porTasa = calcularOperacion({
      items,
      gastos,
      config: { ...config, seguro: { modo: "tasa", primaNeta: 0, tasaPrima: 0.003 } },
    });
    expect(porTasa.liquidacion.primaNeta).toBe(redondear(e.cfr * 0.003, 2));
    expect(porTasa.liquidacion.cif).toBeCloseTo(e.cfr + redondear(e.cfr * 0.003, 2), 9);
  });

  it("capital requerido = CIF + gastos + IGV de gastos + pago SUNAT = costo + crédito fiscal", () => {
    const t = r.totales;
    expect(t.capitalRequerido).toBeCloseTo(
      e.cif + e.gastosAfectos + e.gastosNoAfectos + e.igvGastos + e.deudaAduanera + e.percepcion,
      6,
    );
    expect(t.capitalRequerido).toBeCloseTo(t.costoTotal + r.creditoFiscal.total, 6);
    // El Ad Valorem no se cuenta dos veces aunque esté en el costo y en el pago a SUNAT
    expect(t.capitalRequerido).toBeLessThan(t.costoTotal + r.liquidacion.totalPagoSunat);
    // El desembolso no cambia si el importador recupera o no el crédito fiscal
    const b2c = calcularOperacion({ items, gastos, config: { ...config, recuperaCreditoFiscal: false } });
    expect(b2c.totales.capitalRequerido).toBeCloseTo(t.capitalRequerido, 6);
    expect(b2c.totales.capitalRequerido).toBeCloseTo(b2c.totales.costoTotal, 6);
  });

  it("punto de equilibrio en la misma moneda: ⌈cantidad × (1 − margen)⌉", () => {
    expect(calcularPrecioVenta(5.13, 480, 0.4, 0.18).puntoEquilibrioUnidades).toBe(288);
  });

  it("ADV distinto por SKU: total redondeado como SUNAT y repartido", () => {
    const mixto = items.map((it, i) => ({ ...it, tasaAdValorem: [0, 0.06, 0.11][i % 3] }));
    const res = calcularOperacion({ items: mixto, gastos, config });
    const exacto = res.items.reduce((acc, it, i) => acc + it.cif * mixto[i].tasaAdValorem, 0);
    expect(res.liquidacion.adValorem).toBe(redondear(exacto, 0));
    expect(res.items[0].adValorem).toBe(0);
  });

  it("B2C sin crédito fiscal: IGV/IPM/percepción pasan a ser costo", () => {
    const b2c = calcularOperacion({ items, gastos, config: { ...config, recuperaCreditoFiscal: false } });
    expect(b2c.totales.costoTotal).toBeCloseTo(e.costoTotalUsd + creditoFiscalSinIgvSeguro, 6);
  });

  it("redondear imita ROUND de Excel", () => {
    expect(redondear(2.675, 2)).toBe(2.68);
    expect(redondear(2751.5, 0)).toBe(2752);
    expect(redondear(-1.5, 0)).toBe(-2);
  });

  it("500 SKUs se recalculan en menos de 10 ms", () => {
    const muchos = Array.from({ length: 500 }, (_, i) => ({ ...items[i % items.length], id: `m${i}` }));
    calcularOperacion({ items: muchos, gastos, config });
    const t0 = performance.now();
    calcularOperacion({ items: muchos, gastos, config });
    expect(performance.now() - t0).toBeLessThan(10);
  });
});

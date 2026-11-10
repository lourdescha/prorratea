import { describe, expect, it } from "vitest";
import { calcularOperacion, CONFIG_PERU, resumirInversion, type ConfiguracionCosteo, type ItemImportacion } from "@/core/costeo";

const item: ItemImportacion = {
  id: "a",
  partNumber: "A1",
  descripcion: "",
  unidad: "Unid.",
  cantidad: 100,
  fobUnitario: 10,
  partidaArancelaria: "",
  tasaAdValorem: 0.06,
  tasaIsc: 0,
  pesoKgUnitario: 0,
  volumenM3Unitario: 0,
  margen: null,
};
const gastos = [
  { id: "g", concepto: "Handling", categoria: "operador_logistico" as const, monto: 200, afectoIgv: true, metodo: "valor_fob" as const },
];

const operar = (patch: Partial<ConfiguracionCosteo>) => {
  const config = { ...CONFIG_PERU, fleteInternacional: 150, ...patch };
  return { r: calcularOperacion({ items: [item], gastos, config }), config };
};

describe("resumen de inversión para el cliente", () => {
  it("el crédito utilizado nunca supera el IGV de las ventas ni el crédito disponible", () => {
    const { r, config } = operar({ margenGlobal: 0.4 });
    const x = resumirInversion(r, config);
    expect(x.igvVentasPen).toBeCloseTo(r.totales.ingresoTotalPen * 0.18, 9);
    expect(x.creditoUtilizadoPen).toBeCloseTo(Math.min(r.creditoFiscal.totalPen, x.igvVentasPen), 9);
    expect(x.creditoUtilizadoPen + x.saldoAFavorPen).toBeCloseTo(r.creditoFiscal.totalPen, 9);
    expect(x.creditoUtilizadoPen + x.igvNetoPorPagarPen).toBeCloseTo(x.igvVentasPen, 9);
  });

  it("con margen bajo queda saldo a favor", () => {
    const { r, config } = operar({ margenGlobal: 0.01 });
    const x = resumirInversion(r, config);
    expect(x.saldoAFavorPen).toBeGreaterThan(0);
    expect(x.igvNetoPorPagarPen).toBe(0);
    expect(x.usoCredito).toBeLessThan(1);
  });

  it("sin crédito fiscal no hay nada que utilizar", () => {
    const { r, config } = operar({ recuperaCreditoFiscal: false });
    const x = resumirInversion(r, config);
    expect(x.creditoDisponiblePen).toBe(0);
    expect(x.igvNetoPorPagarPen).toBeCloseTo(x.igvVentasPen, 9);
  });

  it("ROI y punto de equilibrio salen de la política de margen", () => {
    const { r, config } = operar({ margenGlobal: 0.4 });
    const x = resumirInversion(r, config);
    // VV = costo / 0.6 → ganancia / costo = 0.4 / 0.6; equilibrio = 60 % del lote
    expect(x.roi).toBeCloseTo(0.4 / 0.6, 9);
    expect(x.ventaParaEquilibrio).toBeCloseTo(0.6, 9);
  });
});

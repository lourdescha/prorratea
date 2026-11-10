import { dividir } from "./numeros";
import type { ConfiguracionCosteo, ResultadoCosteo } from "./types";

/**
 * Lectura de inversión, crédito fiscal y rentabilidad del lote para el cliente
 * (hojas 2 en adelante de la Liquidación Oficial). Supone que se vende todo el
 * lote al precio de la política de márgenes.
 *
 *   IGV de ventas (débito) = valor de venta × 18 %
 *   Crédito utilizado      = min(crédito fiscal, débito)
 *   Saldo a favor          = crédito − utilizado   (se arrastra a los meses siguientes)
 *   IGV neto por pagar     = débito − utilizado
 */
export interface ResumenInversion {
  igvVentasPen: number;
  /** 0 si el importador no recupera crédito fiscal (ya está dentro del costo) */
  creditoDisponiblePen: number;
  creditoUtilizadoPen: number;
  saldoAFavorPen: number;
  igvNetoPorPagarPen: number;
  /** Fracción del crédito que absorben las ventas del lote */
  usoCredito: number;
  /** Utilidad / costo puesto en almacén */
  roi: number;
  /** Fracción del lote que hay que vender para recuperar el costo */
  ventaParaEquilibrio: number;
}

export function resumirInversion(
  { totales: t, creditoFiscal: cf }: ResultadoCosteo,
  config: ConfiguracionCosteo,
): ResumenInversion {
  const igvVentasPen = t.ingresoTotalPen * config.tributos.tasaIgvServicios;
  const creditoDisponiblePen = config.recuperaCreditoFiscal ? cf.totalPen : 0;
  const creditoUtilizadoPen = Math.min(creditoDisponiblePen, igvVentasPen);
  return {
    igvVentasPen,
    creditoDisponiblePen,
    creditoUtilizadoPen,
    saldoAFavorPen: creditoDisponiblePen - creditoUtilizadoPen,
    igvNetoPorPagarPen: igvVentasPen - creditoUtilizadoPen,
    usoCredito: dividir(creditoUtilizadoPen, creditoDisponiblePen),
    roi: dividir(t.gananciaTotalPen, t.costoTotalPen),
    ventaParaEquilibrio: Math.min(1, dividir(t.costoTotalPen, t.ingresoTotalPen)),
  };
}

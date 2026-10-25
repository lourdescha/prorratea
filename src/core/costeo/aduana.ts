import { redondear, sumar } from "./numeros";
import { repartir } from "./prorrateo";
import type { ParametrosSeguro, ParametrosTributarios } from "./types";

/* ------------------------------------------------------------------ */
/* Seguro (hoja Tributos Aduana, bloque "Cálculo del seguro")          */
/* ------------------------------------------------------------------ */

/**
 * Prima neta = monto de la póliza (US$) o CFR × tasa de prima.
 * El seguro internacional de importación está inafecto a IGV: entra al CIF
 * pero nunca genera crédito fiscal.
 */
export function calcularPrimaSeguro(cfr: number, p: ParametrosSeguro): number {
  return p.modo === "monto" ? p.primaNeta : redondear(cfr * p.tasaPrima, 2);
}

/* ------------------------------------------------------------------ */
/* Deuda aduanera                                                      */
/* ------------------------------------------------------------------ */

export interface BaseItemAduana {
  cif: number;
  tasaAdValorem: number;
  tasaIsc: number;
}

export interface TributosPorItem {
  adValorem: number[];
  isc: number[];
  ipm: number[];
  igv: number[];
  percepcion: number[];
}

export interface TotalesTributos {
  adValorem: number;
  isc: number;
  ipm: number;
  igv: number;
  deudaAduanera: number;
  percepcion: number;
}

/**
 * Cascada SUNAT (validada contra el Excel):
 *   ADV  = ROUND(CIF × %ADV, 0)
 *   ISC  = ROUND((CIF + ADV) × %ISC, 0)
 *   IPM  = ROUND((CIF + ADV + ISC) × 2 %, 0)
 *   IGV  = ROUND((CIF + ADV + ISC) × 16 %, 0)
 *   DA   = ADV + ISC + IPM + IGV
 *   Perc = ROUND((CIF + DA) × %percepción, 2)
 *
 * A diferencia del Excel (un solo %ADV para toda la operación), aquí cada SKU
 * puede tener su propia tasa. El total se redondea como lo liquida SUNAT y luego
 * se reparte entre los SKUs en proporción a su tributo exacto.
 */
export function calcularTributos(
  bases: BaseItemAduana[],
  p: ParametrosTributarios,
): { porItem: TributosPorItem; totales: TotalesTributos } {
  const r0 = (v: number) => (p.redondeoSunat ? redondear(v, 0) : v);
  const r2 = (v: number) => (p.redondeoSunat ? redondear(v, 2) : v);

  const advExacto = bases.map((b) => b.cif * (b.tasaAdValorem || 0));
  const adValorem = r0(sumar(advExacto));
  const advItem = repartir(adValorem, advExacto);

  const iscExacto = bases.map((b, i) => (b.cif + advItem[i]) * (b.tasaIsc || 0));
  const isc = r0(sumar(iscExacto));
  const iscItem = repartir(isc, iscExacto);

  const baseIgv = bases.map((b, i) => b.cif + advItem[i] + iscItem[i]);
  const totalBaseIgv = sumar(baseIgv);
  const ipm = r0(totalBaseIgv * p.tasaIpm);
  const igv = r0(totalBaseIgv * p.tasaIgv);
  const ipmItem = repartir(ipm, baseIgv);
  const igvItem = repartir(igv, baseIgv);

  const deudaAduanera = adValorem + isc + ipm + igv;
  const basePercepcion = baseIgv.map((b, i) => b + ipmItem[i] + igvItem[i]);
  const percepcion = r2(sumar(basePercepcion) * p.tasaPercepcion);

  return {
    porItem: {
      adValorem: advItem,
      isc: iscItem,
      ipm: ipmItem,
      igv: igvItem,
      percepcion: repartir(percepcion, basePercepcion),
    },
    totales: { adValorem, isc, ipm, igv, deudaAduanera, percepcion },
  };
}

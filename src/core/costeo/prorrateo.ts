import { dividir, sumar } from "./numeros";
import type { ItemImportacion, MetodoProrrateo } from "./types";

/** Base de reparto de cada item según el método. */
export function pesosPorMetodo(items: ItemImportacion[], metodo: MetodoProrrateo): number[] {
  return items.map((item) => {
    const cantidad = item.cantidad || 0;
    switch (metodo) {
      case "valor_fob":
        return cantidad * (item.fobUnitario || 0);
      case "peso":
        return cantidad * (item.pesoKgUnitario || 0);
      case "volumen":
        return cantidad * (item.volumenM3Unitario || 0);
      case "unidades":
        return cantidad;
    }
  });
}

/**
 * Reparte `monto` en proporción a `pesos`: monto × peso_i / Σpesos.
 * Es el "factor de prorrateo" del Excel generalizado a cualquier base.
 * Si todos los pesos son 0 devuelve `respaldo` (o ceros) para no perder el monto.
 */
export function repartir(monto: number, pesos: number[], respaldo?: number[]): number[] {
  const total = sumar(pesos);
  if (total === 0) {
    return respaldo && sumar(respaldo) !== 0 ? repartir(monto, respaldo) : pesos.map(() => 0);
  }
  return pesos.map((peso) => dividir(monto * peso, total));
}

/** Prorratea por método; si nadie cargó peso/volumen cae a valor FOB. */
export function prorratear(monto: number, items: ItemImportacion[], metodo: MetodoProrrateo) {
  return repartir(monto, pesosPorMetodo(items, metodo), pesosPorMetodo(items, "valor_fob"));
}

import { dividir } from "./numeros";
import type { ClasificacionMargen } from "./types";

export const MARGEN_ALTO = 0.5;
export const MARGEN_MEDIO = 0.3;

export interface PrecioVenta {
  valorVentaUnitarioPen: number;
  precioVentaConIgvPen: number;
  gananciaUnitariaPen: number;
  roi: number;
  puntoEquilibrioUnidades: number;
  clasificacion: ClasificacionMargen;
}

/**
 * Política de utilidad sobre el precio de venta (hoja "Precio de Venta"):
 *   VV  = C/M unit. / (1 − margen)
 *   PV  = VV × (1 + 18 %)
 *   Ganancia = VV − C/M unit.
 *
 * Punto de equilibrio: unidades a vender para recuperar el costo total del SKU
 * = ⌈C/M total / VV⌉. (El Excel divide un costo en USD entre un precio en S/ con
 * IGV, lo que subestima el resultado ~4×; aquí se corrige.)
 */
export function calcularPrecioVenta(
  costoUnitarioPen: number,
  cantidad: number,
  margen: number,
  tasaIgvVenta: number,
): PrecioVenta {
  const margenValido = margen < 1 ? margen : 0;
  const valorVentaUnitarioPen = dividir(costoUnitarioPen, 1 - margenValido);
  const gananciaUnitariaPen = valorVentaUnitarioPen - costoUnitarioPen;

  return {
    valorVentaUnitarioPen,
    precioVentaConIgvPen: valorVentaUnitarioPen * (1 + tasaIgvVenta),
    gananciaUnitariaPen,
    roi: dividir(gananciaUnitariaPen, costoUnitarioPen),
    puntoEquilibrioUnidades:
      valorVentaUnitarioPen === 0
        ? 0
        : Math.ceil(Number(((costoUnitarioPen * cantidad) / valorVentaUnitarioPen).toPrecision(12))),
    clasificacion: clasificarMargen(margenValido),
  };
}

export function clasificarMargen(margen: number): ClasificacionMargen {
  if (margen >= MARGEN_ALTO) return "alto";
  if (margen >= MARGEN_MEDIO) return "medio";
  return "bajo";
}

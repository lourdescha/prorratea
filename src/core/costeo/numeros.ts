/**
 * Aritmética del motor. Se usa `number` (IEEE-754, igual que Excel) en lugar de
 * una librería decimal: así los resultados coinciden con el Excel maestro y el
 * recálculo de 500 SKUs toma ~1 ms. El redondeo solo se aplica donde SUNAT lo exige.
 */

/** ROUND de Excel: mitad hacia arriba, alejándose de cero, sin errores de representación. */
export function redondear(valor: number, decimales = 0): number {
  if (!Number.isFinite(valor)) return 0;
  const factor = 10 ** decimales;
  const normalizado = Number((Math.abs(valor) * factor).toPrecision(15));
  return (Math.sign(valor) * Math.round(normalizado)) / factor;
}

export const sumar = (valores: number[]) => valores.reduce((acc, v) => acc + v, 0);

export const dividir = (a: number, b: number) => (b === 0 ? 0 : a / b);

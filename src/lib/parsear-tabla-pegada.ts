import type { ItemImportacion } from "@/core/costeo";

/**
 * Convierte texto pegado desde Excel / Google Sheets (TSV) en SKUs.
 * Orden de columnas = hoja "Factura Comercial" del Excel maestro:
 *   Part Number | Descripción | Unidad | Cantidad | FOB unit. (USD)
 * Ignora filas de encabezado o vacías.
 */
export function parsearTablaPegada(texto: string): Partial<ItemImportacion>[] {
  return texto
    .split(/\r?\n/)
    .map((linea) => linea.split("\t").map((c) => c.trim()))
    .filter((cols) => cols.some(Boolean))
    .map(([partNumber = "", descripcion = "", unidad = "", cantidad = "", fob = ""]) => ({
      partNumber,
      descripcion,
      unidad: unidad || "Unid.",
      cantidad: aNumero(cantidad),
      fobUnitario: aNumero(fob),
    }))
    .filter((it) => Number.isFinite(it.cantidad) && Number.isFinite(it.fobUnitario));
}

/** Acepta "1,234.50", "1.234,50", "$ 0.68" y "1234". */
function aNumero(valor: string): number {
  let v = valor.replace(/[^\d.,-]/g, "");
  if (!v) return Number.NaN;
  const ultimaComa = v.lastIndexOf(",");
  const ultimoPunto = v.lastIndexOf(".");
  if (ultimaComa > ultimoPunto) v = v.replace(/\./g, "").replace(",", ".");
  else v = v.replace(/,/g, "");
  return Number(v);
}

import type { GastoImportacion } from "@/core/costeo";
import type { DatosReporte } from "../reporte-pdf";

/** Empresa que emite la liquidación (el operador logístico). */
export interface DatosEmisor {
  marca: string;
  lema: string;
  razonSocial: string;
  ruc: string;
  telefono: string;
  correo: string;
  web: string;
  firmante: string;
  cargo: string;
}

/** Lo que cambia de una liquidación a otra y no vive en la operación. */
export interface OpcionesLiquidacion {
  numero: string;
  regimen: string;
  atencion: string;
  vigenciaDias: number;
  condiciones: string;
}

export interface DatosLiquidacion extends DatosReporte {
  gastos: GastoImportacion[];
  emisor: DatosEmisor;
  opciones: OpcionesLiquidacion;
}

export const REGIMENES = [
  "Importación para el consumo (10)",
  "Importación simplificada / courier",
  "Admisión temporal (20)",
  "Depósito aduanero (70)",
] as const;

export const EMISOR_POR_DEFECTO: DatosEmisor = {
  marca: "Importa Simple",
  lema: "Tu puerta al mundo",
  razonSocial: "Negocios Digitales E.I.R.L.",
  ruc: "20603309244",
  telefono: "997 967 948",
  correo: "ventas@importasimple.com",
  web: "importasimple.com",
  firmante: "Lourdes Chávez",
  cargo: "Gerente General",
};

export const CONDICIONES_POR_DEFECTO =
  "Montos estimados con la información de la factura comercial y la cotización de la agencia de carga. " +
  "La liquidación final está sujeta a la DAM numerada por SUNAT y a las facturas de los operadores.";

/** Correlativo legible y sin colisiones prácticas: LIQ-AAAAMMDD-HHMM */
export function numeroLiquidacion(fecha = new Date()) {
  const d = (n: number) => String(n).padStart(2, "0");
  return `LIQ-${fecha.getFullYear()}${d(fecha.getMonth() + 1)}${d(fecha.getDate())}-${d(fecha.getHours())}${d(fecha.getMinutes())}`;
}

/* Los datos del emisor se recuerdan en este navegador: se escriben una sola vez. */
const CLAVE_EMISOR = "prorratea_emisor_liquidacion";

export function leerEmisor(): DatosEmisor {
  try {
    const guardado = localStorage.getItem(CLAVE_EMISOR);
    return guardado ? { ...EMISOR_POR_DEFECTO, ...JSON.parse(guardado) } : EMISOR_POR_DEFECTO;
  } catch {
    return EMISOR_POR_DEFECTO;
  }
}

export function guardarEmisor(emisor: DatosEmisor) {
  try {
    localStorage.setItem(CLAVE_EMISOR, JSON.stringify(emisor));
  } catch {
    // Modo privado o almacenamiento lleno: la liquidación igual se genera
  }
}

import type { CategoriaGasto, ConfiguracionCosteo } from "./types";

/**
 * Valores por defecto de Perú tomados del Excel maestro. Validar con un agente
 * de aduanas: la percepción depende del perfil del importador y el ADV de la partida.
 */
export const CONFIG_PERU: ConfiguracionCosteo = {
  tipoCambio: 3.72,
  fleteInternacional: 0,
  metodoProrrateoFlete: "valor_fob",
  tributos: {
    tasaIgv: 0.16,
    tasaIpm: 0.02,
    tasaPercepcion: 0.035,
    tasaIgvServicios: 0.18,
    redondeoSunat: true,
  },
  seguro: {
    modo: "monto",
    primaNeta: 0,
    tasaPrima: 0,
  },
  recuperaCreditoFiscal: true,
  margenGlobal: 0.4,
};

export const TASAS_AD_VALOREM = [0, 0.06, 0.11] as const;

export const TASAS_PERCEPCION = [
  { tasa: 0.035, etiqueta: "3.5 % — importador frecuente" },
  { tasa: 0.1, etiqueta: "10 % — primera importación / empresa nueva" },
  { tasa: 0.05, etiqueta: "5 % — bienes de segundo uso" },
] as const;

/** Conceptos de la hoja "Gastos Importación", para precargar el Paso 3. */
export const PLANTILLA_GASTOS: { concepto: string; categoria: CategoriaGasto; afectoIgv: boolean }[] = [
  { concepto: "Handling", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Servicio de descarga", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Movilización de carga", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Tracción", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Servicio al cliente (V°B°)", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Comisión del agente de aduanas", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Gastos operativos agente", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Almacenaje", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Cargadores / cuadrilla", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Servicios administrativos", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Seguro de contenedor", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Posicionamiento de carga", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Transporte interno / última milla", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Precinto", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Otros gastos", categoria: "operador_logistico", afectoIgv: true },
  { concepto: "Gastos administrativos empresa", categoria: "administrativo", afectoIgv: false },
  { concepto: "Comisión por transferencia bancaria", categoria: "financiero", afectoIgv: false },
  { concepto: "Intereses de letras", categoria: "financiero", afectoIgv: false },
  { concepto: "Emisión carta de crédito", categoria: "financiero", afectoIgv: false },
  { concepto: "Comisiones carta de crédito", categoria: "financiero", afectoIgv: false },
];

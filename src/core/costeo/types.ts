/**
 * Tipos de dominio del motor de costeo de importaciones (Perú / SUNAT).
 * Modelo extraído del Excel maestro "CCI" (hojas Datos Generales, Factura Comercial,
 * Gastos Importación, Tributos Aduana, Costos x Producto, Precio de Venta, Crédito Fiscal).
 *
 * Capa pura: no importa React, Zustand ni Supabase.
 * Convención: montos en USD salvo sufijo `Pen`; tasas como fracción (0.06 = 6 %).
 */

export type MetodoProrrateo = "valor_fob" | "peso" | "volumen" | "unidades";

export type CategoriaGasto = "operador_logistico" | "administrativo" | "financiero";

export type ClasificacionMargen = "alto" | "medio" | "bajo";

/* ------------------------------------------------------------------ */
/* Entradas                                                            */
/* ------------------------------------------------------------------ */

/** Una línea de la Factura Comercial. */
export interface ItemImportacion {
  id: string;
  /** "Code / Número de parte" del proveedor: identifica el SKU entre operaciones */
  partNumber: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  fobUnitario: number;
  partidaArancelaria: string;
  tasaAdValorem: number;
  tasaIsc: number;
  pesoKgUnitario: number;
  volumenM3Unitario: number;
  /** null = usa el margen global de la operación */
  margen: number | null;
}

/** Gasto pagado a operadores (hoja "Gastos Importación"). */
export interface GastoImportacion {
  id: string;
  concepto: string;
  categoria: CategoriaGasto;
  monto: number;
  /** ⭐ en el Excel: genera IGV 18 % que va a crédito fiscal */
  afectoIgv: boolean;
  metodo: MetodoProrrateo;
}

export interface ParametrosTributarios {
  /** IGV de importación (16 %) */
  tasaIgv: number;
  /** Impuesto de Promoción Municipal (2 %) */
  tasaIpm: number;
  /** 3.5 % frecuente | 10 % primera importación | 5 % bienes usados */
  tasaPercepcion: number;
  /** IGV + IPM sobre servicios y ventas locales (18 %) */
  tasaIgvServicios: number;
  /** Redondeo de la liquidación SUNAT: ADV/ISC/IPM/IGV a enteros, percepción a 2 dec. */
  redondeoSunat: boolean;
}

export interface ParametrosSeguro {
  /** "monto": prima neta de la póliza (US$) | "tasa": prima = CFR × tasaPrima */
  modo: "monto" | "tasa";
  primaNeta: number;
  tasaPrima: number;
}

export interface ConfiguracionCosteo {
  /** USD → PEN */
  tipoCambio: number;
  fleteInternacional: number;
  metodoProrrateoFlete: MetodoProrrateo;
  tributos: ParametrosTributarios;
  /** Inafecto a IGV. La comisión del agente de aduanas es un gasto más. */
  seguro: ParametrosSeguro;
  /** Importador con RUC que recupera IGV/IPM/percepción. false = esos montos son costo. */
  recuperaCreditoFiscal: boolean;
  /** Margen sobre precio de venta: VV = costo / (1 − margen) */
  margenGlobal: number;
}

export interface EntradaCosteo {
  items: ItemImportacion[];
  gastos: GastoImportacion[];
  config: ConfiguracionCosteo;
}

/* ------------------------------------------------------------------ */
/* Salidas                                                             */
/* ------------------------------------------------------------------ */

export interface ResultadoItem {
  id: string;
  /** Participación en el FOB total */
  participacionFob: number;
  fob: number;
  flete: number;
  seguro: number;
  cif: number;
  adValorem: number;
  isc: number;
  ipm: number;
  igv: number;
  percepcion: number;
  /** Gastos de importación asignados (afectos + no afectos, sin su IGV) */
  gastos: number;
  creditoFiscal: number;
  /** C/M: costo de mercadería puesto en almacén */
  costoTotal: number;
  costoUnitario: number;
  costoUnitarioPen: number;
  factorImportacion: number;
  margen: number;
  valorVentaUnitarioPen: number;
  precioVentaConIgvPen: number;
  gananciaUnitariaPen: number;
  gananciaTotalPen: number;
  ingresoTotalPen: number;
  /** Ganancia / costo */
  roi: number;
  /** Unidades a vender para recuperar el costo total del SKU */
  puntoEquilibrioUnidades: number;
  clasificacion: ClasificacionMargen;
}

export interface LiquidacionAduana {
  fob: number;
  flete: number;
  cfr: number;
  primaNeta: number;
  /** Valor en aduanas */
  cif: number;
  adValorem: number;
  isc: number;
  ipm: number;
  igv: number;
  /** DA = ADV + ISC + IPM + IGV */
  deudaAduanera: number;
  percepcion: number;
  /** Lo que se paga a SUNAT: DA + percepción */
  totalPagoSunat: number;
}

export interface LineaGastoCalculada {
  id: string;
  concepto: string;
  monto: number;
  afectoIgv: boolean;
  igv: number;
}

export interface ResumenGastos {
  lineas: LineaGastoCalculada[];
  afectos: number;
  noAfectos: number;
  igvGastos: number;
}

export interface CreditoFiscal {
  ipm: number;
  igvAduanas: number;
  percepcion: number;
  igvGastos: number;
  total: number;
  totalPen: number;
}

export interface TotalesOperacion {
  skus: number;
  unidades: number;
  fob: number;
  costoTotal: number;
  costoTotalPen: number;
  /**
   * Capital requerido: todo lo que sale del banco para nacionalizar la carga
   * = CIF + gastos sin IGV + IGV de gastos + pago a SUNAT.
   * Equivale a costo puesto en almacén + crédito fiscal (con RUC).
   */
  capitalRequerido: number;
  capitalRequeridoPen: number;
  factorImportacion: number;
  ingresoTotalPen: number;
  gananciaTotalPen: number;
  margenReal: number;
}

export type CodigoAdvertencia =
  | "sin_items"
  | "item_sin_cantidad"
  | "item_sin_precio"
  | "margen_invalido"
  | "tipo_cambio_invalido";

export interface Advertencia {
  codigo: CodigoAdvertencia;
  itemId?: string;
  mensaje: string;
}

export interface ResultadoCosteo {
  items: ResultadoItem[];
  porId: Record<string, ResultadoItem>;
  liquidacion: LiquidacionAduana;
  gastos: ResumenGastos;
  creditoFiscal: CreditoFiscal;
  totales: TotalesOperacion;
  advertencias: Advertencia[];
}

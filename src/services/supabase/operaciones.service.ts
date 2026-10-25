import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConfiguracionCosteo,
  GastoImportacion,
  ItemImportacion,
  ResultadoCosteo,
} from "@/core/costeo";
import type { DatosGenerales } from "@/stores/nuevo-proyecto.store";
import type { Database, GastoRow, ItemRow, OperacionRow } from "./database.types";

type Cliente = SupabaseClient<Database>;

export interface OperacionPayload {
  id: string;
  organizacionId: string;
  datosGenerales: DatosGenerales;
  config: ConfiguracionCosteo;
  items: ItemImportacion[];
  gastos: GastoImportacion[];
  resultado: ResultadoCosteo;
}

/* Mappers dominio ↔ filas: el resto de la app nunca ve snake_case. */

function operacionToRow(p: OperacionPayload): Partial<OperacionRow> {
  const d = p.datosGenerales;
  const c = p.config;
  return {
    id: p.id,
    organizacion_id: p.organizacionId,
    estado: "calculada",
    nombre: d.nombre,
    numero_dam: d.numeroDam || null,
    importador_razon_social: d.importadorRazonSocial || null,
    importador_ruc: d.importadorRuc || null,
    fecha_numeracion: d.fechaNumeracion || null,
    pais_origen: d.paisOrigen || null,
    proveedor_nombre: d.proveedor || null,
    incoterm: d.incoterm,
    via_transporte: d.viaTransporte,
    puerto_embarque: d.puertoEmbarque || null,
    puerto_destino: d.puertoDestino || null,
    agente_aduanas: d.agenteAduanas || null,
    canal_control: d.canalControl,
    tipo_cambio: c.tipoCambio,
    flete_internacional: c.fleteInternacional,
    metodo_prorrateo_flete: c.metodoProrrateoFlete,
    tasa_igv: c.tributos.tasaIgv,
    tasa_ipm: c.tributos.tasaIpm,
    tasa_percepcion: c.tributos.tasaPercepcion,
    tasa_igv_servicios: c.tributos.tasaIgvServicios,
    redondeo_sunat: c.tributos.redondeoSunat,
    seguro_modo: c.seguro.modo,
    seguro_prima_neta: c.seguro.primaNeta,
    seguro_tasa_prima: c.seguro.tasaPrima,
    // Columnas retiradas del modelo (seguro inafecto, comisión del agente manual)
    seguro_tasa_deducible: 0,
    seguro_tasa_derecho_emision: 0,
    agente_calculo_automatico: false,
    recupera_credito_fiscal: c.recuperaCreditoFiscal,
    margen_global: c.margenGlobal,
    // Solo KPIs agregados: el detalle por SKU vive en items_operacion
    resultado: {
      liquidacion: { ...p.resultado.liquidacion },
      creditoFiscal: { ...p.resultado.creditoFiscal },
      totales: { ...p.resultado.totales },
    },
  };
}

const itemToRow = (it: ItemImportacion, posicion: number, r: ResultadoCosteo) => ({
  id: it.id,
  posicion,
  part_number: it.partNumber,
  descripcion: it.descripcion,
  unidad: it.unidad,
  cantidad: it.cantidad,
  fob_unitario: it.fobUnitario,
  partida_arancelaria: it.partidaArancelaria,
  tasa_ad_valorem: it.tasaAdValorem,
  tasa_isc: it.tasaIsc,
  peso_kg_unitario: it.pesoKgUnitario,
  volumen_m3_unitario: it.volumenM3Unitario,
  margen: it.margen,
  costo_unitario_usd: r.porId[it.id]?.costoUnitario ?? null,
  costo_unitario_pen: r.porId[it.id]?.costoUnitarioPen ?? null,
});

const gastoToRow = (g: GastoImportacion, posicion: number) => ({
  id: g.id,
  posicion,
  concepto: g.concepto,
  categoria: g.categoria,
  monto: g.monto,
  afecto_igv: g.afectoIgv,
  metodo: g.metodo,
});

const rowToItem = (r: ItemRow): ItemImportacion => ({
  id: r.id,
  partNumber: r.part_number,
  descripcion: r.descripcion,
  unidad: r.unidad,
  cantidad: Number(r.cantidad),
  fobUnitario: Number(r.fob_unitario),
  partidaArancelaria: r.partida_arancelaria ?? "",
  tasaAdValorem: Number(r.tasa_ad_valorem),
  tasaIsc: Number(r.tasa_isc),
  pesoKgUnitario: Number(r.peso_kg_unitario),
  volumenM3Unitario: Number(r.volumen_m3_unitario),
  margen: r.margen === null ? null : Number(r.margen),
});

const rowToGasto = (r: GastoRow): GastoImportacion => ({
  id: r.id,
  concepto: r.concepto,
  categoria: r.categoria,
  monto: Number(r.monto),
  afectoIgv: r.afecto_igv,
  metodo: r.metodo,
});

/**
 * Guarda cabecera + SKUs + gastos en UNA transacción (RPC `guardar_operacion`).
 * Los gastos con monto 0 de la plantilla no se persisten.
 */
export async function guardarOperacion(supabase: Cliente, p: OperacionPayload): Promise<string> {
  const { data, error } = await supabase.rpc("guardar_operacion", {
    p_operacion: operacionToRow(p),
    p_items: p.items.map((it, i) => itemToRow(it, i, p.resultado)),
    p_gastos: p.gastos.filter((g) => g.monto > 0).map(gastoToRow),
  });
  if (error) throw error;
  return data;
}

export async function obtenerOperacion(supabase: Cliente, id: string) {
  const [operacion, items, gastos] = await Promise.all([
    supabase.from("operaciones_importacion").select("*").eq("id", id).single(),
    supabase.from("items_operacion").select("*").eq("operacion_id", id).order("posicion"),
    supabase.from("gastos_operacion").select("*").eq("operacion_id", id).order("posicion"),
  ]);
  if (operacion.error) throw operacion.error;
  if (items.error) throw items.error;
  if (gastos.error) throw gastos.error;
  return {
    operacion: operacion.data,
    items: items.data.map(rowToItem),
    gastos: gastos.data.map(rowToGasto),
  };
}

export async function listarOperaciones(supabase: Cliente, organizacionId: string) {
  const { data, error } = await supabase
    .from("operaciones_importacion")
    .select("id, nombre, numero_dam, proveedor_nombre, estado, resultado, updated_at")
    .eq("organizacion_id", organizacionId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

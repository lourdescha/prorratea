"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  calcularOperacion,
  CONFIG_PERU,
  PLANTILLA_GASTOS,
  type ConfiguracionCosteo,
  type GastoImportacion,
  type ItemImportacion,
  type ParametrosSeguro,
  type ParametrosTributarios,
  type ResultadoCosteo,
} from "@/core/costeo";

export const MAX_SKUS = 500;

export const PASOS = [
  { id: 1, titulo: "Datos generales", descripcion: "Operación y tipo de cambio" },
  { id: 2, titulo: "Inventario", descripcion: "SKUs de la factura comercial" },
  { id: 3, titulo: "Gastos y tributos", descripcion: "Flete, seguro y operadores" },
  { id: 4, titulo: "Resultados", descripcion: "Costos, márgenes y crédito fiscal" },
] as const;
export type Paso = (typeof PASOS)[number]["id"];

export type Incoterm = "EXW" | "FCA" | "FOB" | "CFR" | "CIF" | "DAP" | "DDP";
export type ViaTransporte = "maritima" | "aerea" | "terrestre";
export type CanalControl = "verde" | "naranja" | "rojo";
export type EstadoGuardado = "idle" | "guardando" | "guardado" | "error";

/** Hoja "Datos Generales" del Excel, bloque "Datos de la operación". */
export interface DatosGenerales {
  nombre: string;
  numeroDam: string;
  importadorRazonSocial: string;
  importadorRuc: string;
  fechaNumeracion: string;
  paisOrigen: string;
  proveedor: string;
  incoterm: Incoterm;
  viaTransporte: ViaTransporte;
  puertoEmbarque: string;
  puertoDestino: string;
  agenteAduanas: string;
  canalControl: CanalControl | null;
}

interface NuevoProyectoData {
  pasoActual: Paso;
  proyectoId: string | null;
  datosGenerales: DatosGenerales;
  config: ConfiguracionCosteo;
  /** Normalizado: editar un SKU no cambia la referencia de los otros 499 */
  items: Record<string, ItemImportacion>;
  itemIds: string[];
  gastos: Record<string, GastoImportacion>;
  gastoIds: string[];
  estadoGuardado: EstadoGuardado;
}

interface NuevoProyectoAcciones {
  irAPaso: (paso: Paso) => void;
  setDatosGenerales: (patch: Partial<DatosGenerales>) => void;
  setConfig: (patch: Partial<Omit<ConfiguracionCosteo, "tributos" | "seguro">>) => void;
  setTributos: (patch: Partial<ParametrosTributarios>) => void;
  setSeguro: (patch: Partial<ParametrosSeguro>) => void;
  agregarItem: (item?: Partial<ItemImportacion>) => string | null;
  /** Pegar/importar en bloque; devuelve cuántos entraron (tope MAX_SKUS) */
  agregarItems: (items: Partial<ItemImportacion>[]) => number;
  actualizarItem: (id: string, patch: Partial<Omit<ItemImportacion, "id">>) => void;
  eliminarItems: (ids: string[]) => void;
  agregarGasto: (gasto?: Partial<GastoImportacion>) => string;
  actualizarGasto: (id: string, patch: Partial<Omit<GastoImportacion, "id">>) => void;
  eliminarGasto: (id: string) => void;
  setProyectoId: (id: string) => void;
  setEstadoGuardado: (estado: EstadoGuardado) => void;
  reset: () => void;
  /** Reemplaza el borrador por una operación guardada (abrir) o su copia (duplicar). */
  cargarOperacion: (op: OperacionCargada) => void;
}

export type NuevoProyectoState = NuevoProyectoData & NuevoProyectoAcciones;

export interface OperacionCargada {
  proyectoId: string | null;
  datosGenerales: DatosGenerales;
  config: ConfiguracionCosteo;
  items: ItemImportacion[];
  gastos: GastoImportacion[];
}

const nuevoId = () => crypto.randomUUID();

export const itemVacio = (patch: Partial<ItemImportacion> = {}): ItemImportacion => ({
  partNumber: "",
  descripcion: "",
  unidad: "Unid.",
  cantidad: 0,
  fobUnitario: 0,
  partidaArancelaria: "",
  tasaAdValorem: 0.06,
  tasaIsc: 0,
  pesoKgUnitario: 0,
  volumenM3Unitario: 0,
  margen: null,
  ...patch,
  id: patch.id ?? nuevoId(),
});

const gastoVacio = (patch: Partial<GastoImportacion> = {}): GastoImportacion => ({
  concepto: "",
  categoria: "operador_logistico",
  monto: 0,
  afectoIgv: true,
  metodo: "valor_fob",
  ...patch,
  id: patch.id ?? nuevoId(),
});

/** Conserva el borrador v2: quita los campos retirados y agrega la fila de comisión del agente. */
function migrarV2(d: NuevoProyectoData): NuevoProyectoData {
  const config = d.config as ConfiguracionCosteo & { agente?: unknown };
  const { modo, primaNeta, tasaPrima } = config.seguro;
  delete config.agente;
  config.seguro = { modo, primaNeta, tasaPrima };

  const concepto = "Comisión del agente de aduanas";
  const yaExiste = Object.values(d.gastos).some((g) => g.concepto.toLowerCase() === concepto.toLowerCase());
  if (!yaExiste) {
    const g = gastoVacio({ concepto });
    d.gastos = { ...d.gastos, [g.id]: g };
    d.gastoIds = [g.id, ...d.gastoIds];
  }
  return d;
}

const estadoInicial = (): NuevoProyectoData => {
  const gastos = PLANTILLA_GASTOS.map((g) => gastoVacio(g));
  return {
    pasoActual: 1,
    proyectoId: null,
    datosGenerales: {
      nombre: "",
      numeroDam: "",
      importadorRazonSocial: "",
      importadorRuc: "",
      fechaNumeracion: "",
      paisOrigen: "",
      proveedor: "",
      incoterm: "FOB",
      viaTransporte: "maritima",
      puertoEmbarque: "",
      puertoDestino: "Callao, Perú",
      agenteAduanas: "",
      canalControl: null,
    },
    config: structuredClone(CONFIG_PERU),
    items: {},
    itemIds: [],
    gastos: Object.fromEntries(gastos.map((g) => [g.id, g])),
    gastoIds: gastos.map((g) => g.id),
    estadoGuardado: "idle",
  };
};

export const useNuevoProyectoStore = create<NuevoProyectoState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...estadoInicial(),

        irAPaso: (paso) => set({ pasoActual: paso }),

        setDatosGenerales: (patch) =>
          set((s) => {
            Object.assign(s.datosGenerales, patch);
          }),
        setConfig: (patch) =>
          set((s) => {
            Object.assign(s.config, patch);
          }),
        setTributos: (patch) =>
          set((s) => {
            Object.assign(s.config.tributos, patch);
          }),
        setSeguro: (patch) =>
          set((s) => {
            Object.assign(s.config.seguro, patch);
          }),

        agregarItem: (patch) => {
          if (get().itemIds.length >= MAX_SKUS) return null;
          const item = itemVacio(patch);
          set((s) => {
            s.items[item.id] = item;
            s.itemIds.push(item.id);
          });
          return item.id;
        },

        agregarItems: (lote) => {
          const cupo = MAX_SKUS - get().itemIds.length;
          const aceptados = lote.slice(0, Math.max(cupo, 0)).map(itemVacio);
          set((s) => {
            for (const item of aceptados) {
              s.items[item.id] = item;
              s.itemIds.push(item.id);
            }
          });
          return aceptados.length;
        },

        actualizarItem: (id, patch) =>
          set((s) => {
            if (s.items[id]) Object.assign(s.items[id], patch);
          }),

        eliminarItems: (ids) =>
          set((s) => {
            const borrar = new Set(ids);
            for (const id of ids) delete s.items[id];
            s.itemIds = s.itemIds.filter((id) => !borrar.has(id));
          }),

        agregarGasto: (patch) => {
          const gasto = gastoVacio(patch);
          set((s) => {
            s.gastos[gasto.id] = gasto;
            s.gastoIds.push(gasto.id);
          });
          return gasto.id;
        },

        actualizarGasto: (id, patch) =>
          set((s) => {
            if (s.gastos[id]) Object.assign(s.gastos[id], patch);
          }),

        eliminarGasto: (id) =>
          set((s) => {
            delete s.gastos[id];
            s.gastoIds = s.gastoIds.filter((g) => g !== id);
          }),

        setProyectoId: (id) => set({ proyectoId: id }),
        setEstadoGuardado: (estado) => set({ estadoGuardado: estado }),
        reset: () => set(estadoInicial()),
        cargarOperacion: (op) =>
          set({
            pasoActual: op.items.length > 0 ? 4 : 1,
            proyectoId: op.proyectoId,
            datosGenerales: op.datosGenerales,
            config: op.config,
            items: Object.fromEntries(op.items.map((it) => [it.id, it])),
            itemIds: op.items.map((it) => it.id),
            gastos: Object.fromEntries(op.gastos.map((g) => [g.id, g])),
            gastoIds: op.gastos.map((g) => g.id),
            estadoGuardado: op.proyectoId ? "guardado" : "idle",
          }),
      })),
      {
        name: "nuevo-proyecto-borrador",
        storage: createJSONStorage(() => localStorage),
        // El borrador sobrevive a un refresh; "guardando"/"error" no tienen sentido tras recargar.
        partialize: (s) => ({
          estadoGuardado: s.estadoGuardado === "guardado" ? ("guardado" as const) : ("idle" as const),
          pasoActual: s.pasoActual,
          proyectoId: s.proyectoId,
          datosGenerales: s.datosGenerales,
          config: s.config,
          items: s.items,
          itemIds: s.itemIds,
          gastos: s.gastos,
          gastoIds: s.gastoIds,
        }),
        // Evita mismatch de hidratación SSR: se rehidrata en el cliente (useHidratarBorrador).
        skipHydration: true,
        // v2: modelo alineado al Excel maestro; los borradores v1 se descartan.
        // v3: seguro sin deducible/derecho de emisión y comisión del agente manual.
        version: 3,
        migrate: (persistido, version) =>
          (version === 2
            ? migrarV2(persistido as NuevoProyectoData)
            : estadoInicial()) as unknown as NuevoProyectoState,
      },
    ),
    { name: "NuevoProyecto" },
  ),
);

// Cualquier edición posterior a un guardado deja la operación con cambios sin guardar.
useNuevoProyectoStore.subscribe((s, prev) => {
  if (s.estadoGuardado !== "guardado" || prev.estadoGuardado !== "guardado") return;
  const cambio =
    s.items !== prev.items ||
    s.itemIds !== prev.itemIds ||
    s.gastos !== prev.gastos ||
    s.gastoIds !== prev.gastoIds ||
    s.config !== prev.config ||
    s.datosGenerales !== prev.datosGenerales;
  if (cambio) useNuevoProyectoStore.setState({ estadoGuardado: "idle" });
});

/* ------------------------------------------------------------------ */
/* Selectores                                                          */
/* ------------------------------------------------------------------ */

/**
 * Resultado del motor memoizado por referencia de entradas: se calcula una
 * sola vez por cambio de estado aunque lo lean 500 filas + el dashboard.
 * Al devolver la misma referencia, Zustand no re-renderiza de más.
 */
let cache: { entradas: unknown[]; resultado: ResultadoCosteo } | null = null;

export function selectResultado(s: NuevoProyectoState): ResultadoCosteo {
  const entradas = [s.items, s.itemIds, s.gastos, s.gastoIds, s.config];
  if (cache && entradas.every((e, i) => e === cache!.entradas[i])) return cache.resultado;

  const resultado = calcularOperacion({
    items: s.itemIds.map((id) => s.items[id]),
    gastos: s.gastoIds.map((id) => s.gastos[id]),
    config: s.config,
  });
  cache = { entradas, resultado };
  return resultado;
}

export const usePasoActual = () => useNuevoProyectoStore((s) => s.pasoActual);
export const useItemIds = () => useNuevoProyectoStore((s) => s.itemIds);
export const useItem = (id: string) => useNuevoProyectoStore((s) => s.items[id]);
export const useGastoIds = () => useNuevoProyectoStore((s) => s.gastoIds);
export const useGasto = (id: string) => useNuevoProyectoStore((s) => s.gastos[id]);
export const useConfig = () => useNuevoProyectoStore((s) => s.config);
export const useResultado = () => useNuevoProyectoStore(selectResultado);
export const useResultadoItem = (id: string) =>
  useNuevoProyectoStore((s) => selectResultado(s).porId[id]);

/** Montar una vez en la página del asistente para recuperar el borrador local. */
export function useHidratarBorrador() {
  useEffect(() => {
    // Solo la primera vez: rehidratar de nuevo reemplaza objetos y parecería una edición
    if (!useNuevoProyectoStore.persist.hasHydrated()) void useNuevoProyectoStore.persist.rehydrate();
  }, []);
}

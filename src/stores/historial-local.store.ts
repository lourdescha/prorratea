"use client";

import { create } from "zustand";
import type {
  ConfiguracionCosteo,
  GastoImportacion,
  ItemImportacion,
  ResultadoCosteo,
} from "@/core/costeo";
import type { DatosGenerales, OperacionCargada } from "./nuevo-proyecto.store";

/**
 * Historial de cotizaciones guardado SOLO en este navegador (localStorage).
 * Pensado para talleres donde varios alumnos comparten una cuenta: cada uno
 * ve únicamente lo que guardó en su propio navegador.
 */
const CLAVE = "prorratea_historial";
/** 500 SKUs ≈ 150 KB; con 30 cotizaciones se queda lejos del límite de ~5 MB */
const MAX_COTIZACIONES = 30;

export interface CotizacionGuardada {
  id: string;
  guardadoEl: string;
  datosGenerales: DatosGenerales;
  config: ConfiguracionCosteo;
  items: ItemImportacion[];
  gastos: GastoImportacion[];
  resumen: {
    skus: number;
    costoTotalPen: number;
    capitalRequeridoPen: number;
  };
  /** Costo unitario S/ por Part Number normalizado, para comparar con compras futuras */
  costosPen: Record<string, number>;
}

/** "fc3457 " y "FC3457" son el mismo SKU. */
export const normalizarPartNumber = (pn: string) => pn.trim().toUpperCase();

function leer(): CotizacionGuardada[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    const datos: unknown = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(datos) ? (datos as CotizacionGuardada[]) : [];
  } catch {
    return [];
  }
}

/** Escribe; si el navegador se queda sin espacio, descarta las más antiguas. */
function escribir(lista: CotizacionGuardada[]): CotizacionGuardada[] {
  let actual = lista.slice(0, MAX_COTIZACIONES);
  while (actual.length > 0) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(actual));
      return actual;
    } catch {
      if (actual.length === 1) throw new Error("El navegador no tiene espacio para guardar esta cotización.");
      actual = actual.slice(0, -1);
    }
  }
  localStorage.removeItem(CLAVE);
  return actual;
}

interface HistorialLocalState {
  cotizaciones: CotizacionGuardada[];
  hidratado: boolean;
  hidratar: () => void;
  /** Inserta o actualiza (mismo id) y la deja primera. Devuelve cuántas se descartaron por espacio. */
  guardar: (op: OperacionCargada & { proyectoId: string }, resultado: ResultadoCosteo) => number;
  eliminar: (id: string) => void;
  obtener: (id: string) => CotizacionGuardada | undefined;
}

export const useHistorialLocalStore = create<HistorialLocalState>()((set, get) => ({
  cotizaciones: [],
  hidratado: false,
  hidratar: () => {
    if (!get().hidratado) set({ cotizaciones: leer(), hidratado: true });
  },
  guardar: (op, resultado) => {
    const costosPen: Record<string, number> = {};
    op.items.forEach((it) => {
      const pn = normalizarPartNumber(it.partNumber);
      const r = resultado.porId[it.id];
      if (pn && r) costosPen[pn] = r.costoUnitarioPen;
    });
    const nueva: CotizacionGuardada = {
      id: op.proyectoId,
      guardadoEl: new Date().toISOString(),
      datosGenerales: op.datosGenerales,
      config: op.config,
      items: op.items,
      gastos: op.gastos,
      resumen: {
        skus: resultado.totales.skus,
        costoTotalPen: resultado.totales.costoTotalPen,
        capitalRequeridoPen: resultado.totales.capitalRequeridoPen,
      },
      costosPen,
    };
    // Relee por si otra pestaña guardó algo mientras tanto
    const previa = leer().filter((c) => c.id !== nueva.id);
    const deseada = [nueva, ...previa];
    const guardada = escribir(deseada);
    set({ cotizaciones: guardada, hidratado: true });
    return Math.min(deseada.length, MAX_COTIZACIONES) - guardada.length;
  },
  eliminar: (id) => {
    set({ cotizaciones: escribir(leer().filter((c) => c.id !== id)) });
  },
  obtener: (id) => get().cotizaciones.find((c) => c.id === id),
}));

// Mantiene sincronizadas varias pestañas abiertas
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === CLAVE) useHistorialLocalStore.setState({ cotizaciones: leer(), hidratado: true });
  });
}

/* ------------------------------------------------------------------ */
/* Comparación con la compra anterior del mismo SKU                    */
/* ------------------------------------------------------------------ */

export interface UltimoCosto {
  costoUnitarioPen: number;
  fecha: string;
  operacion: string;
  numeroDam: string;
}

let memo: { lista: CotizacionGuardada[]; excluir: string | null; mapa: Record<string, UltimoCosto> } | null = null;

/** Para cada Part Number, la cotización guardada más reciente que lo incluye (sin contar la actual). */
function ultimosCostos(lista: CotizacionGuardada[], excluir: string | null): Record<string, UltimoCosto> {
  if (memo && memo.lista === lista && memo.excluir === excluir) return memo.mapa;
  const mapa: Record<string, UltimoCosto> = {};
  // La lista está ordenada de más reciente a más antigua: gana la primera aparición
  for (const c of lista) {
    if (c.id === excluir) continue;
    for (const [pn, costo] of Object.entries(c.costosPen)) {
      if (!(pn in mapa)) {
        mapa[pn] = {
          costoUnitarioPen: costo,
          fecha: (c.datosGenerales.fechaNumeracion || c.guardadoEl).slice(0, 10),
          operacion: c.datosGenerales.nombre,
          numeroDam: c.datosGenerales.numeroDam,
        };
      }
    }
  }
  memo = { lista, excluir, mapa };
  return mapa;
}

export const useUltimoCosto = (partNumber: string, excluir: string | null) =>
  useHistorialLocalStore((s) => ultimosCostos(s.cotizaciones, excluir)[normalizarPartNumber(partNumber)]);

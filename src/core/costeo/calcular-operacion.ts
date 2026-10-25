import { calcularPrimaSeguro, calcularTributos } from "./aduana";
import { dividir, sumar } from "./numeros";
import { calcularPrecioVenta } from "./precio-venta";
import { pesosPorMetodo, prorratear, repartir } from "./prorrateo";
import type {
  Advertencia,
  EntradaCosteo,
  LineaGastoCalculada,
  ResultadoCosteo,
  ResultadoItem,
} from "./types";

/**
 * Motor de costeo: función pura y determinista, O(items × gastos).
 *
 *   FOB → + flete → CFR → + prima → CIF → tributos SUNAT → + gastos → C/M
 *   Factor de importación = C/M total / FOB total
 *   C/M unitario = Factor × FOB unitario   (cuando todo se prorratea por FOB)
 *
 * Solo el ADV (e ISC) es costo. IGV, IPM, percepción e IGV de gastos son
 * crédito fiscal, salvo que el importador no lo recupere (B2C / sin RUC).
 * El seguro internacional es inafecto: no genera IGV.
 */
export function calcularOperacion({ items, gastos, config }: EntradaCosteo): ResultadoCosteo {
  const { tributos: pt } = config;

  // 1. FOB y flete → CFR
  const fob = pesosPorMetodo(items, "valor_fob");
  const fobTotal = sumar(fob);
  const flete = prorratear(config.fleteInternacional, items, config.metodoProrrateoFlete);
  const cfr = fob.map((v, i) => v + flete[i]);
  const cfrTotal = fobTotal + config.fleteInternacional;

  // 2. Seguro → CIF
  const primaNeta = calcularPrimaSeguro(cfrTotal, config.seguro);
  const prima = repartir(primaNeta, cfr);
  const cif = cfr.map((v, i) => v + prima[i]);
  const cifTotal = cfrTotal + primaNeta;

  // 3. Deuda aduanera y percepción
  const { porItem: trib, totales: tt } = calcularTributos(
    items.map((item, i) => ({ cif: cif[i], tasaAdValorem: item.tasaAdValorem, tasaIsc: item.tasaIsc })),
    pt,
  );

  // 4. Gastos de importación (incluida la comisión del agente, ingresada a mano)
  const gastoItem = items.map(() => 0);
  const igvGastoItem = items.map(() => 0);
  const lineas: LineaGastoCalculada[] = gastos.map((g) => {
    const reparto = prorratear(g.monto, items, g.metodo);
    reparto.forEach((monto, i) => {
      gastoItem[i] += monto;
      if (g.afectoIgv) igvGastoItem[i] += monto * pt.tasaIgvServicios;
    });
    return {
      id: g.id,
      concepto: g.concepto,
      monto: g.monto,
      afectoIgv: g.afectoIgv,
      igv: g.afectoIgv ? g.monto * pt.tasaIgvServicios : 0,
    };
  });
  const afectos = sumar(lineas.filter((l) => l.afectoIgv).map((l) => l.monto));
  const noAfectos = sumar(lineas.filter((l) => !l.afectoIgv).map((l) => l.monto));
  const igvGastos = afectos * pt.tasaIgvServicios;

  // 5. Crédito fiscal y costo por SKU
  const tc = config.tipoCambio;

  const resultados: ResultadoItem[] = items.map((item, i) => {
    const creditoFiscal =
      trib.ipm[i] + trib.igv[i] + trib.percepcion[i] + igvGastoItem[i];
    const costoTotal =
      cif[i] +
      trib.adValorem[i] +
      trib.isc[i] +
      gastoItem[i] +
      (config.recuperaCreditoFiscal ? 0 : creditoFiscal);
    const costoUnitario = dividir(costoTotal, item.cantidad);
    const costoUnitarioPen = costoUnitario * tc;
    const margen = item.margen ?? config.margenGlobal;
    const pv = calcularPrecioVenta(costoUnitarioPen, item.cantidad, margen, pt.tasaIgvServicios);

    return {
      id: item.id,
      participacionFob: dividir(fob[i], fobTotal),
      fob: fob[i],
      flete: flete[i],
      seguro: prima[i],
      cif: cif[i],
      adValorem: trib.adValorem[i],
      isc: trib.isc[i],
      ipm: trib.ipm[i],
      igv: trib.igv[i],
      percepcion: trib.percepcion[i],
      gastos: gastoItem[i],
      creditoFiscal,
      costoTotal,
      costoUnitario,
      costoUnitarioPen,
      factorImportacion: dividir(costoTotal, fob[i]),
      margen,
      ...pv,
      gananciaTotalPen: pv.gananciaUnitariaPen * item.cantidad,
      ingresoTotalPen: pv.valorVentaUnitarioPen * item.cantidad,
    };
  });

  const costoTotal = sumar(resultados.map((r) => r.costoTotal));
  const ingresoTotalPen = sumar(resultados.map((r) => r.ingresoTotalPen));
  const gananciaTotalPen = sumar(resultados.map((r) => r.gananciaTotalPen));
  const creditoFiscalTotal = tt.ipm + tt.igv + tt.percepcion + igvGastos;
  const totalPagoSunat = tt.deudaAduanera + tt.percepcion;
  // Desembolso real: no depende de si el crédito fiscal se recupera después
  const capitalRequerido = cifTotal + afectos + noAfectos + igvGastos + totalPagoSunat;

  return {
    items: resultados,
    porId: Object.fromEntries(resultados.map((r) => [r.id, r])),
    liquidacion: {
      fob: fobTotal,
      flete: config.fleteInternacional,
      cfr: cfrTotal,
      primaNeta,
      cif: cifTotal,
      ...tt,
      totalPagoSunat,
    },
    gastos: { lineas, afectos, noAfectos, igvGastos },
    creditoFiscal: {
      ipm: tt.ipm,
      igvAduanas: tt.igv,
      percepcion: tt.percepcion,
      igvGastos,
      total: creditoFiscalTotal,
      totalPen: creditoFiscalTotal * tc,
    },
    totales: {
      skus: items.length,
      unidades: sumar(items.map((it) => it.cantidad || 0)),
      fob: fobTotal,
      costoTotal,
      costoTotalPen: costoTotal * tc,
      capitalRequerido,
      capitalRequeridoPen: capitalRequerido * tc,
      factorImportacion: dividir(costoTotal, fobTotal),
      ingresoTotalPen,
      gananciaTotalPen,
      margenReal: dividir(gananciaTotalPen, ingresoTotalPen),
    },
    advertencias: detectarAdvertencias(items, config.tipoCambio, config.margenGlobal),
  };
}

function detectarAdvertencias(
  items: EntradaCosteo["items"],
  tipoCambio: number,
  margenGlobal: number,
): Advertencia[] {
  const out: Advertencia[] = [];
  if (items.length === 0) out.push({ codigo: "sin_items", mensaje: "Agrega al menos un SKU." });
  if (!(tipoCambio > 0)) {
    out.push({ codigo: "tipo_cambio_invalido", mensaje: "El tipo de cambio debe ser mayor a 0." });
  }
  if (margenGlobal >= 1) {
    out.push({ codigo: "margen_invalido", mensaje: "El margen sobre precio debe ser menor a 100 %." });
  }
  for (const item of items) {
    const nombre = item.partNumber || item.descripcion || "SKU sin nombre";
    if (!(item.cantidad > 0)) {
      out.push({ codigo: "item_sin_cantidad", itemId: item.id, mensaje: `${nombre}: falta la cantidad.` });
    }
    if (!(item.fobUnitario > 0)) {
      out.push({ codigo: "item_sin_precio", itemId: item.id, mensaje: `${nombre}: falta el FOB unitario.` });
    }
    if (item.margen !== null && item.margen >= 1) {
      out.push({ codigo: "margen_invalido", itemId: item.id, mensaje: `${nombre}: margen ≥ 100 %.` });
    }
  }
  return out;
}

import { Document, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { ConfiguracionCosteo, ItemImportacion, ResultadoCosteo } from "@/core/costeo";
import type { DatosGenerales } from "@/stores/nuevo-proyecto.store";
import { factor, num, pct, pen, usd } from "../formato";

/**
 * Reporte ejecutivo en PDF (vectorial, texto seleccionable). Se carga con
 * import() solo al hacer clic en "Descargar", para no pesar en el bundle.
 */
export interface DatosReporte {
  datosGenerales: DatosGenerales;
  config: ConfiguracionCosteo;
  items: ItemImportacion[];
  resultado: ResultadoCosteo;
  generadoEl: Date;
}

// Paleta categórica validada (misma que los gráficos de la app, modo claro)
const COLORES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
const TINTA = "#0f172a";
const MARCA = "#312e81";
const TINTA_2 = "#64748b";
const LINEA = "#e2e8f0";
const FONDO_SUAVE = "#f1f5f9";
const FONDO_MARCA = "#eef2ff";

const FILAS_POR_PAGINA = 34;

const s = StyleSheet.create({
  pagina: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 36, fontFamily: "Helvetica", fontSize: 8.5, color: TINTA },
  encabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 1.5, borderBottomColor: MARCA, paddingBottom: 8, marginBottom: 14 },
  marca: { fontSize: 8, color: MARCA, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1 },
  titulo: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 2 },
  meta: { fontSize: 8, color: TINTA_2, textAlign: "right", lineHeight: 1.4 },
  seccion: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginBottom: 6, marginTop: 4 },
  tarjetaHero: { backgroundColor: FONDO_MARCA, borderRadius: 6, padding: 14, flexDirection: "row", gap: 24, marginBottom: 12 },
  heroMonto: { fontSize: 22, fontFamily: "Helvetica-Bold", color: MARCA },
  silenciado: { color: TINTA_2 },
  fila: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  kpis: { flexDirection: "row", gap: 8, marginBottom: 16 },
  kpi: { flex: 1, borderWidth: 1, borderColor: LINEA, borderRadius: 6, padding: 9 },
  kpiEtiqueta: { fontSize: 7.5, color: TINTA_2, marginBottom: 4 },
  kpiValor: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  composicion: { flexDirection: "row", alignItems: "center", gap: 24, borderWidth: 1, borderColor: LINEA, borderRadius: 6, padding: 14 },
  muestra: { width: 7, height: 7, borderRadius: 1.5, marginRight: 6 },
  tabla: { borderWidth: 1, borderColor: LINEA, borderRadius: 4 },
  thead: { flexDirection: "row", backgroundColor: FONDO_SUAVE, borderBottomWidth: 1, borderBottomColor: LINEA, fontFamily: "Helvetica-Bold", fontSize: 7.5 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINEA, minHeight: 17, alignItems: "center" },
  td: { paddingHorizontal: 5, paddingVertical: 4 },
  pie: { position: "absolute", bottom: 22, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: TINTA_2 },
});

const COLUMNAS = [
  { titulo: "Part number", ancho: "13%", alinear: "left" },
  { titulo: "Descripción", ancho: "29%", alinear: "left" },
  { titulo: "Cant.", ancho: "8%", alinear: "right" },
  { titulo: "Costo unit. S/", ancho: "12%", alinear: "right" },
  { titulo: "Margen", ancho: "8%", alinear: "right" },
  { titulo: "Precio c/IGV S/", ancho: "13%", alinear: "right" },
  { titulo: "Ganancia S/", ancho: "17%", alinear: "right" },
] as const;

const recortar = (t: string, max: number) => (t.length > max ? `${t.slice(0, max - 1)}…` : t);

function Encabezado({ d }: { d: DatosReporte }) {
  const g = d.datosGenerales;
  return (
    <View style={s.encabezado}>
      <View>
        <Text style={s.marca}>Prorratea · Reporte ejecutivo de costeo</Text>
        <Text style={s.titulo}>{g.nombre || "Operación sin nombre"}</Text>
      </View>
      <View>
        <Text style={s.meta}>Tipo de cambio: S/ {d.config.tipoCambio.toFixed(3)} por US$ 1</Text>
        {g.numeroDam ? <Text style={s.meta}>DAM {g.numeroDam}</Text> : null}
        {g.proveedor ? <Text style={s.meta}>Proveedor: {g.proveedor}</Text> : null}
        <Text style={s.meta}>Generado el {d.generadoEl.toLocaleDateString("es-PE")}</Text>
      </View>
    </View>
  );
}

function Pie({ d }: { d: DatosReporte }) {
  return (
    <View style={s.pie} fixed>
      <Text>{d.datosGenerales.nombre || "Operación"} · Montos estimados, valida con tu agente de aduanas.</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  );
}

/** Sector de anillo de a0 a a1 (radianes, 0 = arriba, sentido horario). */
function arco(cx: number, cy: number, R: number, r: number, a0: number, a1: number) {
  const p = (radio: number, a: number) => `${cx + radio * Math.sin(a)} ${cy - radio * Math.cos(a)}`;
  const grande = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${p(R, a0)} A ${R} ${R} 0 ${grande} 1 ${p(R, a1)} L ${p(r, a1)} A ${r} ${r} 0 ${grande} 0 ${p(r, a0)} Z`;
}

function Donut({ partes }: { partes: { valor: number; color: string }[] }) {
  const total = partes.reduce((a, p) => a + p.valor, 0);
  const C = 60;
  const visibles = total > 0 ? partes.filter((p) => p.valor > 0) : [];
  // Ángulos acumulados; un anillo completo no se dibuja con un solo arco: se topa a 99.99 %
  const fracciones = visibles.map((p) => Math.min(p.valor / total, 0.9999));
  const inicios = fracciones.map((_, i) => fracciones.slice(0, i).reduce((a, f) => a + f, 0) * Math.PI * 2);
  return (
    <Svg width={C * 2} height={C * 2} viewBox={`0 0 ${C * 2} ${C * 2}`}>
      {visibles.map((p, i) => (
        <Path
          key={i}
          d={arco(C, C, C, C * 0.62, inicios[i], inicios[i] + fracciones[i] * Math.PI * 2)}
          fill={p.color}
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      ))}
    </Svg>
  );
}

export function ReportePdf({ d }: { d: DatosReporte }) {
  const { totales: t, liquidacion: l, gastos } = d.resultado;
  const tc = d.config.tipoCambio;
  const nombres = Object.fromEntries(d.items.map((it) => [it.id, it]));

  const composicion = [
    { etiqueta: "FOB (mercadería)", valor: l.fob },
    { etiqueta: "Flete", valor: l.flete },
    { etiqueta: "Seguro", valor: l.primaNeta },
    { etiqueta: "Ad Valorem / ISC", valor: l.adValorem + l.isc },
    { etiqueta: "Gastos de importación", valor: gastos.afectos + gastos.noAfectos },
  ];
  const resto = t.costoTotal - composicion.reduce((a, c) => a + c.valor, 0);
  if (resto > 0.005) composicion.push({ etiqueta: "IGV, IPM y percepción", valor: resto });
  const partes = composicion.map((c, i) => ({ ...c, color: COLORES[i] }));

  const paginas: (typeof d.resultado.items)[] = [];
  for (let i = 0; i < d.resultado.items.length; i += FILAS_POR_PAGINA) {
    paginas.push(d.resultado.items.slice(i, i + FILAS_POR_PAGINA));
  }

  return (
    <Document title={`Reporte · ${d.datosGenerales.nombre || "Operación"}`} author="Prorratea" language="es">
      <Page size="A4" style={s.pagina}>
        <Encabezado d={d} />

        <Text style={s.seccion}>Inversión total · capital requerido</Text>
        <View style={s.tarjetaHero}>
          <View>
            <Text style={s.heroMonto}>{pen(t.capitalRequeridoPen)}</Text>
            <Text style={[s.silenciado, { marginTop: 3 }]}>{usd(t.capitalRequerido)}</Text>
          </View>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={s.fila}>
              <Text style={s.silenciado}>Costo total puesto en almacén</Text>
              <Text>{pen(t.costoTotalPen)}</Text>
            </View>
            {d.config.recuperaCreditoFiscal ? (
              <View style={s.fila}>
                <Text style={s.silenciado}>+ IGV, IPM y percepción que adelantas (crédito fiscal)</Text>
                <Text>{pen((t.capitalRequerido - t.costoTotal) * tc)}</Text>
              </View>
            ) : null}
            <Text style={[s.silenciado, { fontSize: 7.5, marginTop: 4 }]}>
              Lo que debes tener en el banco para pagar y nacionalizar esta operación.
            </Text>
          </View>
        </View>

        <View style={s.kpis}>
          <View style={s.kpi}>
            <Text style={s.kpiEtiqueta}>Costo puesto en almacén</Text>
            <Text style={s.kpiValor}>{pen(t.costoTotalPen)}</Text>
            <Text style={[s.silenciado, { marginTop: 2 }]}>{usd(t.costoTotal)}</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiEtiqueta}>Factor de importación</Text>
            <Text style={s.kpiValor}>{factor(t.factorImportacion)}</Text>
            <Text style={[s.silenciado, { marginTop: 2 }]}>por cada US$ 1 FOB</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiEtiqueta}>Pago total a SUNAT</Text>
            <Text style={s.kpiValor}>{usd(l.totalPagoSunat)}</Text>
            <Text style={[s.silenciado, { marginTop: 2 }]}>Ad Valorem {usd(l.adValorem)}</Text>
            <Text style={s.silenciado}>IGV + IPM + Percep. {usd(l.igv + l.ipm + l.percepcion)}</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiEtiqueta}>Utilidad bruta estimada</Text>
            <Text style={s.kpiValor}>{pen(t.gananciaTotalPen)}</Text>
            <Text style={[s.silenciado, { marginTop: 2 }]}>Margen real {pct(t.margenReal)}</Text>
          </View>
        </View>

        <Text style={s.seccion}>Composición del costo de importación</Text>
        <View style={s.composicion}>
          <Donut partes={partes} />
          <View style={{ flex: 1 }}>
            {partes.map((p) => (
              <View key={p.etiqueta} style={[s.fila, { alignItems: "center", paddingVertical: 3 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <View style={[s.muestra, { backgroundColor: p.color }]} />
                  <Text style={s.silenciado}>{p.etiqueta}</Text>
                </View>
                <Text style={{ width: 90, textAlign: "right" }}>{usd(p.valor)}</Text>
                <Text style={[s.silenciado, { width: 44, textAlign: "right" }]}>
                  {pct(t.costoTotal ? p.valor / t.costoTotal : 0)}
                </Text>
              </View>
            ))}
            <View style={[s.fila, { borderTopWidth: 1, borderTopColor: LINEA, marginTop: 4, paddingTop: 5 }]}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Costo total</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{usd(t.costoTotal)}</Text>
            </View>
          </View>
        </View>

        <Pie d={d} />
      </Page>

      {paginas.map((filas, n) => (
        <Page key={n} size="A4" style={s.pagina}>
          <Encabezado d={d} />
          <Text style={s.seccion}>
            Costo y precio por SKU{paginas.length > 1 ? ` (${n + 1}/${paginas.length})` : ""}
          </Text>
          <View style={s.tabla}>
            <View style={s.thead}>
              {COLUMNAS.map((c) => (
                <Text key={c.titulo} style={[s.td, { width: c.ancho, textAlign: c.alinear }]}>
                  {c.titulo}
                </Text>
              ))}
            </View>
            {filas.map((r) => {
              const it = nombres[r.id];
              const celdas = [
                recortar(it?.partNumber || "—", 16),
                recortar(it?.descripcion ?? "", 38),
                num(it?.cantidad ?? 0),
                pen(r.costoUnitarioPen),
                pct(r.margen),
                pen(r.precioVentaConIgvPen),
                pen(r.gananciaTotalPen),
              ];
              return (
                <View key={r.id} style={s.tr} wrap={false}>
                  {celdas.map((v, i) => (
                    <Text
                      key={i}
                      style={[
                        s.td,
                        { width: COLUMNAS[i].ancho, textAlign: COLUMNAS[i].alinear },
                        i === 1 ? s.silenciado : {},
                      ]}
                    >
                      {v}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>
          {n === paginas.length - 1 ? (
            <Text style={[s.silenciado, { marginTop: 8, fontSize: 7.5 }]}>
              {/* Helvetica (WinAnsi) no tiene "−": se usa guion */}
              {`Precio de venta con IGV = costo ÷ (1 - margen) × 1.18.  ${d.resultado.items.length} SKUs · ${num(t.unidades)} unidades · ingreso estimado ${pen(t.ingresoTotalPen)}.`}
            </Text>
          ) : null}
          <Pie d={d} />
        </Page>
      ))}
    </Document>
  );
}

import { Document, Page, Path, Polygon, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/stylesheet";
import { resumirInversion, type MetodoProrrateo, type ResultadoItem } from "@/core/costeo";
import { factor, num, pct, pen, usd } from "../../formato";
import { COLORES, Donut } from "../reporte-pdf";
import type { DatosEmisor, DatosLiquidacion } from "./datos-liquidacion";

/**
 * Liquidación Oficial en formato corporativo (franjas azul marino, esquinas
 * celestes, logo naranja/azul). Hoja 1 = la liquidación que se entrega para
 * cerrar el servicio; hojas 2+ = dashboard de inversión, crédito fiscal,
 * rentabilidad y prorrateo en destino. Helvetica (WinAnsi): sin "→", "−" ni "≥".
 */

const NAVY = "#0b2a55";
const AZUL = "#1a6fc4";
const CELESTE = "#6cb4e8";
const NARANJA = "#f26b21";
const ROJO = "#e3201b";
const AMARILLO = "#ffd23f";
const VERDE = COLORES[2];
const TINTA = "#0f172a";
const TINTA_2 = "#5b6b82";
const LINEA = "#dbe3ee";
const FONDO = "#f3f7fc";
const FONDO_VERDE = "#e8f7f0";

const A4 = { ancho: 595.28, alto: 841.89 };
const FILAS_SKU = 30;
const TOP_SKUS = 10;

const ETIQUETA_METODO: Record<MetodoProrrateo, string> = {
  valor_fob: "Valor FOB",
  peso: "Peso (kg)",
  volumen: "Volumen (m³)",
  unidades: "Unidades",
};

const s = StyleSheet.create({
  pagina: { paddingTop: 30, paddingBottom: 50, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 8.5, color: TINTA },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  docEtiqueta: { fontSize: 7, color: TINTA_2, textAlign: "right", textTransform: "uppercase", letterSpacing: 0.8 },
  docNumero: { fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY, textAlign: "right", marginTop: 2 },
  tituloHoja: { fontSize: 15, fontFamily: "Helvetica-Bold", color: NAVY },
  subtituloHoja: { fontSize: 8.5, color: TINTA_2, marginTop: 3, marginBottom: 10 },
  seccion: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 5 },
  seccionBarra: { width: 3, height: 11, backgroundColor: NARANJA, marginRight: 6 },
  seccionTexto: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: NAVY, textTransform: "uppercase", letterSpacing: 0.4 },
  silenciado: { color: TINTA_2 },
  negrita: { fontFamily: "Helvetica-Bold" },
  cliente: { flexDirection: "row", gap: 18, backgroundColor: FONDO, borderLeftWidth: 3, borderLeftColor: NAVY, paddingVertical: 7, paddingHorizontal: 10 },
  par: { flexDirection: "row", paddingVertical: 1.6 },
  parEtiqueta: { width: 64, color: TINTA_2 },
  tabla: { borderWidth: 0.75, borderColor: LINEA },
  thead: { flexDirection: "row", backgroundColor: NAVY, color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 7.5 },
  tr: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: LINEA, alignItems: "center" },
  td: { paddingHorizontal: 6, paddingVertical: 3.6 },
  trSubtotal: { backgroundColor: FONDO, fontFamily: "Helvetica-Bold" },
  trGrupo: { backgroundColor: "#eaf1fa", color: NAVY, fontFamily: "Helvetica-Bold", fontSize: 7.5 },
  trTotal: { backgroundColor: NAVY, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  tarjeta: { borderWidth: 0.75, borderColor: LINEA, borderRadius: 6, padding: 11 },
  tarjetaTitulo: { fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 2 },
  tarjetaNota: { fontSize: 7.5, color: TINTA_2, marginBottom: 8 },
  kpiEtiqueta: { fontSize: 7.5, color: TINTA_2, marginBottom: 4 },
  kpiValor: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  pie: { position: "absolute", bottom: 26, left: 130, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center", fontSize: 7.5 },
});

/* ------------------------------------------------------------------ */
/* Marco corporativo                                                   */
/* ------------------------------------------------------------------ */

function Marco() {
  const { ancho: W, alto: H } = A4;
  return (
    <View fixed style={{ position: "absolute", top: 0, left: 0, width: W, height: H }}>
      <Svg width={W} height={H}>
        <Rect x={0} y={0} width={W} height={16} fill={NAVY} />
        <Polygon points={`${W - 170},0 ${W},0 ${W},92 ${W - 40},74`} fill={CELESTE} />
        <Polygon points={`${W - 110},0 ${W},0 ${W},48`} fill={AZUL} />
        <Rect x={0} y={H - 16} width={W} height={16} fill={NAVY} />
        <Polygon points={`0,${H - 74} 108,${H - 34} 108,${H - 16} 0,${H - 16}`} fill={CELESTE} />
        <Polygon points={`0,${H - 44} 60,${H - 16} 0,${H - 16}`} fill={AZUL} />
      </Svg>
    </View>
  );
}

function Logo({ emisor }: { emisor: DatosEmisor }) {
  const [primera, ...resto] = (emisor.marca || "Mi empresa").split(" ");
  return (
    <View>
      <Svg width={46} height={12} viewBox="0 0 46 12">
        <Path d="M2 11 Q 18 4 38 4" stroke={NAVY} strokeWidth={1.2} fill="none" />
        <Polygon points="34,1 45,3.5 34,6.5 36,3.8" fill={NARANJA} />
      </Svg>
      <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", marginTop: -1 }}>
        <Text style={{ color: NARANJA }}>{primera}</Text>
        {resto.length ? <Text style={{ color: AZUL }}> {resto.join(" ")}</Text> : null}
      </Text>
      {emisor.lema ? (
        <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 1, marginLeft: 22 }}>{emisor.lema}</Text>
      ) : null}
    </View>
  );
}

function Cabecera({ d }: { d: DatosLiquidacion }) {
  return (
    <View style={s.cabecera} fixed>
      <Logo emisor={d.emisor} />
      <View style={{ marginTop: 6, marginRight: 70 }}>
        <Text style={s.docEtiqueta}>Liquidación de importación</Text>
        <Text style={s.docNumero}>N° {d.opciones.numero}</Text>
      </View>
    </View>
  );
}

function Pie({ emisor }: { emisor: DatosEmisor }) {
  const contactos = [emisor.telefono, emisor.correo, emisor.web].filter(Boolean);
  return (
    <View style={s.pie} fixed>
      <Text style={s.silenciado} render={({ pageNumber, totalPages }) => `Hoja ${pageNumber} de ${totalPages}`} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        {contactos.map((c) => (
          <View key={c} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: NAVY, marginRight: 4 }} />
            <Text style={{ color: NAVY, fontFamily: "Helvetica-Bold" }}>{c}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Hoja({ d, children }: { d: DatosLiquidacion; children: React.ReactNode }) {
  return (
    <Page size="A4" style={s.pagina}>
      <Marco />
      <Cabecera d={d} />
      {children}
      <Pie emisor={d.emisor} />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */

function Seccion({ children }: { children: string }) {
  return (
    <View style={s.seccion} wrap={false}>
      <View style={s.seccionBarra} />
      <Text style={s.seccionTexto}>{children}</Text>
    </View>
  );
}

function Par({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.par}>
      <Text style={s.parEtiqueta}>{k}</Text>
      <Text style={[s.negrita, { flex: 1 }]}>{v || "—"}</Text>
    </View>
  );
}

type Columna = { ancho: string; alinear: "left" | "right" | "center" };

function Fila({
  cols,
  celdas,
  estilo,
  pad,
}: {
  cols: Columna[];
  celdas: React.ReactNode[];
  estilo?: Style | Style[];
  /** Relleno vertical de la celda; la hoja 1 lo reduce para entrar en una sola página */
  pad?: number;
}) {
  return (
    <View style={[s.tr, ...(Array.isArray(estilo) ? estilo : estilo ? [estilo] : [])]} wrap={false}>
      {celdas.map((c, i) => (
        <View key={i} style={[s.td, { width: cols[i].ancho }, pad !== undefined ? { paddingVertical: pad } : {}]}>
          {typeof c === "string" ? <Text style={{ textAlign: cols[i].alinear }}>{c}</Text> : c}
        </View>
      ))}
    </View>
  );
}

function Encabezados({ cols, titulos, estilo }: { cols: Columna[]; titulos: string[]; estilo?: Style }) {
  return (
    <View style={[s.thead, estilo ?? {}]} wrap={false}>
      {titulos.map((t, i) => (
        <Text key={t} style={[s.td, { width: cols[i].ancho, textAlign: cols[i].alinear }]}>
          {t}
        </Text>
      ))}
    </View>
  );
}

function Barra({ fraccion, color, alto = 9 }: { fraccion: number; color: string; alto?: number }) {
  const f = Number.isFinite(fraccion) ? Math.max(0, Math.min(1, fraccion)) : 0;
  return (
    <View style={{ height: alto, backgroundColor: "#edf1f6", borderRadius: 2 }}>
      {f > 0 ? <View style={{ width: `${f * 100}%`, height: alto, backgroundColor: color, borderRadius: 2 }} /> : null}
    </View>
  );
}

function Kpi({ etiqueta, valor, detalle, color = TINTA, fondo }: { etiqueta: string; valor: string; detalle?: string; color?: string; fondo?: string }) {
  return (
    <View style={[s.tarjeta, { flex: 1 }, fondo ? { backgroundColor: fondo, borderColor: fondo } : {}]}>
      <Text style={[s.kpiEtiqueta, fondo === NAVY ? { color: "#c7d6ec" } : {}]}>{etiqueta}</Text>
      <Text style={[s.kpiValor, { color }]}>{valor}</Text>
      {detalle ? <Text style={[s.silenciado, { marginTop: 3, fontSize: 7.5 }, fondo === NAVY ? { color: "#c7d6ec" } : {}]}>{detalle}</Text> : null}
    </View>
  );
}

/** Ranking compacto: etiqueta, barra y valor en una sola línea. */
function Ranking({ filas, formato }: { filas: { etiqueta: string; valor: number; color: string; nota?: string }[]; formato: (v: number) => string }) {
  const max = Math.max(...filas.map((f) => f.valor), 0);
  return (
    <View style={{ gap: 5 }}>
      {filas.map((f) => (
        <View key={f.etiqueta} style={{ flexDirection: "row", alignItems: "center", gap: 8 }} wrap={false}>
          <Text style={[s.silenciado, { width: 190, fontSize: 7.5 }]}>{f.etiqueta}</Text>
          <View style={{ flex: 1 }}>
            <Barra fraccion={max ? f.valor / max : 0} color={f.color} alto={8} />
          </View>
          <Text style={[s.negrita, { width: 66, textAlign: "right" }]}>{formato(f.valor)}</Text>
          {f.nota ? <Text style={[s.silenciado, { width: 26, textAlign: "right" }]}>{f.nota}</Text> : null}
        </View>
      ))}
    </View>
  );
}

/** Barras horizontales etiquetadas, todas en la misma escala. */
function BarrasH({ filas, formato }: { filas: { etiqueta: string; valor: number; color: string; nota?: string }[]; formato: (v: number) => string }) {
  const max = Math.max(...filas.map((f) => f.valor), 0);
  return (
    <View style={{ gap: 6 }}>
      {filas.map((f) => (
        <View key={f.etiqueta} wrap={false}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
            <Text style={s.silenciado}>{f.etiqueta}</Text>
            <Text style={s.negrita}>
              {formato(f.valor)}
              {f.nota ? <Text style={[s.silenciado, { fontFamily: "Helvetica" }]}>  {f.nota}</Text> : null}
            </Text>
          </View>
          <Barra fraccion={max ? f.valor / max : 0} color={f.color} />
        </View>
      ))}
    </View>
  );
}

const dec2 = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format;
const recortar = (t: string, max: number) => (t.length > max ? `${t.slice(0, max - 1)}…` : t);

/* ------------------------------------------------------------------ */
/* Hoja 1 · Liquidación                                                */
/* ------------------------------------------------------------------ */

const COLS_TRIB: Columna[] = [
  { ancho: "44%", alinear: "left" },
  { ancho: "20%", alinear: "right" },
  { ancho: "18%", alinear: "right" },
  { ancho: "18%", alinear: "right" },
];
const COLS_GASTOS: Columna[] = [
  { ancho: "40%", alinear: "left" },
  { ancho: "15%", alinear: "right" },
  { ancho: "13%", alinear: "right" },
  { ancho: "16%", alinear: "right" },
  { ancho: "16%", alinear: "right" },
];
const COLS_RESUMEN: Columna[] = [
  { ancho: "58%", alinear: "left" },
  { ancho: "21%", alinear: "right" },
  { ancho: "21%", alinear: "right" },
];

function HojaLiquidacion({ d }: { d: DatosLiquidacion }) {
  const { liquidacion: l, gastos: g, creditoFiscal: cf, totales: t } = d.resultado;
  const { tributos: pt, tipoCambio: tc, recuperaCreditoFiscal } = d.config;
  const dg = d.datosGenerales;
  const o = d.opciones;

  const tasasAdv = new Set(d.items.map((it) => it.tasaAdValorem));
  const etiquetaAdv =
    tasasAdv.size === 1 ? `${pct([...tasasAdv][0])} del CIF` : `${pct(l.cif ? l.adValorem / l.cif : 0)} efectivo`;
  const ruta = [dg.paisOrigen || dg.puertoEmbarque, dg.puertoDestino].filter(Boolean).join(" a ");
  const via = { maritima: "Marítima", aerea: "Aérea", terrestre: "Terrestre" }[dg.viaTransporte];

  const filaTrib = (concepto: string, base: string, v: number, estilo?: Style) => (
    <Fila key={concepto} cols={COLS_TRIB} celdas={[concepto, base, usd(v), pen(v * tc)]} estilo={estilo} pad={pad} />
  );

  const categoria = Object.fromEntries(d.gastos.map((x) => [x.id, x.categoria]));
  const lineas = g.lineas.filter((x) => x.monto > 0);
  const grupos = [
    { titulo: "Operativos · agencia de carga, agente de aduanas y almacén", lineas: lineas.filter((x) => (categoria[x.id] ?? "operador_logistico") === "operador_logistico") },
    { titulo: "Terceros · administrativos y financieros", lineas: lineas.filter((x) => categoria[x.id] && categoria[x.id] !== "operador_logistico") },
  ].filter((gr) => gr.lineas.length > 0);
  const gastosNeto = g.afectos + g.noAfectos;
  const gastosConIgv = gastosNeto + g.igvGastos;
  // Con muchas líneas de gastos se compacta para que la liquidación quepa en una hoja
  const filasGastos = lineas.length + grupos.length;
  const pad = filasGastos > 14 ? 1 : filasGastos > 8 ? 2.3 : 3.2;
  const tamano = filasGastos > 14 ? 7.4 : 8.2;

  const resumen = [
    { k: "Mercadería, flete y seguro internacional (valor CIF)", v: l.cif },
    { k: "Tributos de importación pagados a SUNAT (DAM + percepción)", v: l.totalPagoSunat },
    { k: "Gastos operativos y de terceros en destino (con IGV)", v: gastosConIgv },
  ];

  return (
    <Hoja d={d}>
      <Text style={s.tituloHoja}>Liquidación Oficial de Importación</Text>
      <Text style={s.subtituloHoja}>
        Emitida el {d.generadoEl.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
        {o.vigenciaDias > 0 ? ` · Vigencia: ${o.vigenciaDias} días calendario` : ""} · Tipo de cambio S/ {tc.toFixed(3)} por US$ 1
      </Text>

      {/* Cabecera: cliente y régimen */}
      <View style={s.cliente} wrap={false}>
        <View style={{ flex: 1 }}>
          <Par k="Cliente" v={dg.importadorRazonSocial} />
          <Par k="RUC" v={dg.importadorRuc} />
          <Par k="Atención" v={o.atencion} />
          <Par k="Operación" v={dg.nombre} />
          <Par k="Proveedor" v={dg.proveedor} />
        </View>
        <View style={{ flex: 1 }}>
          <Par k="Régimen" v={o.regimen} />
          <Par k="Incoterm / vía" v={`${dg.incoterm} · ${via}`} />
          <Par k="Ruta" v={ruta} />
          <Par k="DAM" v={[dg.numeroDam, dg.canalControl ? `canal ${dg.canalControl}` : ""].filter(Boolean).join(" · ")} />
          <Par k="Mercadería" v={`${num(t.skus)} SKUs · ${num(t.unidades)} unidades`} />
        </View>
      </View>

      <Seccion>1. Valores base y tributos</Seccion>
      <View style={[s.tabla, { fontSize: tamano }]}>
        <Encabezados cols={COLS_TRIB} titulos={["Concepto", "Base / tasa", "US$", "S/"]} />
        {filaTrib("Valor FOB de la mercadería", "Factura comercial", l.fob)}
        {filaTrib("Flete internacional", ETIQUETA_METODO[d.config.metodoProrrateoFlete], l.flete)}
        {filaTrib("Seguro internacional", "Inafecto a IGV", l.primaNeta)}
        {filaTrib("Valor CIF (valor en aduanas)", "", l.cif, s.trSubtotal)}
        {filaTrib("Ad Valorem", etiquetaAdv, l.adValorem)}
        {l.isc > 0 ? filaTrib("Impuesto Selectivo al Consumo", "Según partida", l.isc) : null}
        {filaTrib("IGV", pct(pt.tasaIgv), l.igv)}
        {filaTrib("Impuesto de Promoción Municipal (IPM)", pct(pt.tasaIpm), l.ipm)}
        {filaTrib("Deuda aduanera", "", l.deudaAduanera, s.trSubtotal)}
        {filaTrib("Percepción del IGV (DAM)", pct(pt.tasaPercepcion), l.percepcion)}
        {filaTrib("Total pagado a SUNAT", "", l.totalPagoSunat, s.trTotal)}
      </View>

      <Seccion>2. Gastos operativos y de terceros en destino</Seccion>
      <View style={[s.tabla, { fontSize: tamano }]}>
        <Encabezados cols={COLS_GASTOS} titulos={["Concepto", "Neto US$", `IGV ${pct(pt.tasaIgvServicios)}`, "Total US$", "Total S/"]} />
        {grupos.length === 0 ? (
          <Fila cols={[{ ancho: "100%", alinear: "left" }]} celdas={["Sin gastos en destino registrados."]} estilo={s.silenciado} pad={pad} />
        ) : null}
        {grupos.map((gr) => [
          <Fila key={gr.titulo} cols={[{ ancho: "100%", alinear: "left" }]} celdas={[gr.titulo]} estilo={s.trGrupo} pad={pad} />,
          ...gr.lineas.map((x) => (
            <Fila
              key={x.id}
              cols={COLS_GASTOS}
              celdas={[
                x.concepto || "Gasto sin nombre",
                usd(x.monto),
                x.afectoIgv ? usd(x.igv) : "Inafecto",
                usd(x.monto + x.igv),
                pen((x.monto + x.igv) * tc),
              ]}
              pad={pad}
            />
          )),
        ])}
        <Fila
          cols={COLS_GASTOS}
          celdas={["Total gastos en destino", usd(gastosNeto), usd(g.igvGastos), usd(gastosConIgv), pen(gastosConIgv * tc)]}
          estilo={s.trTotal}
          pad={pad}
        />
      </View>

      <Seccion>3. Resumen final</Seccion>
      <View wrap={false}>
        <View style={s.tabla}>
          <Encabezados cols={COLS_RESUMEN} titulos={["Concepto", "US$", "S/"]} estilo={{ backgroundColor: ROJO, fontSize: 8.5 }} />
          {resumen.map((r) => (
            <Fila key={r.k} cols={COLS_RESUMEN} celdas={[r.k, usd(r.v), pen(r.v * tc)]} pad={pad + 0.6} />
          ))}
          <View style={[s.tr, { backgroundColor: "#000000", color: "#ffffff", fontFamily: "Helvetica-Bold" }]}>
            <View style={[s.td, { width: COLS_RESUMEN[0].ancho, flexDirection: "row", alignItems: "center", paddingVertical: 6 }]}>
              <View style={{ width: 8, height: 8, backgroundColor: AMARILLO, marginRight: 6 }} />
              <Text style={{ fontSize: 9.5 }}>IMPORTE TOTAL DEPOSITADO</Text>
            </View>
            <Text style={[s.td, { width: COLS_RESUMEN[1].ancho, textAlign: "right", fontSize: 10.5 }]}>{usd(t.capitalRequerido)}</Text>
            <Text style={[s.td, { width: COLS_RESUMEN[2].ancho, textAlign: "right", fontSize: 10.5, color: AMARILLO }]}>
              {pen(t.capitalRequeridoPen)}
            </Text>
          </View>
        </View>
        <Text style={[s.silenciado, { marginTop: 5, fontSize: 7.5, lineHeight: 1.4 }]}>
          {recuperaCreditoFiscal
            ? `De este importe, ${usd(cf.total)} (${pen(cf.totalPen)}) es crédito fiscal (IGV, IPM, percepción e IGV de gastos) que recuperas al vender. Costo neto de tu mercadería puesta en almacén: ${usd(t.costoTotal)} (${pen(t.costoTotalPen)}) · factor de importación ${factor(t.factorImportacion)}.`
            : `Sin crédito fiscal: todo el importe es costo de la mercadería puesta en almacén · factor de importación ${factor(t.factorImportacion)}.`}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 24, marginTop: 10 }} wrap={false}>
        <View style={{ flex: 1 }}>
          <Text style={[s.negrita, { color: NAVY, marginBottom: 3 }]}>Condiciones</Text>
          <Text style={[s.silenciado, { fontSize: 7.5, lineHeight: 1.4 }]}>{o.condiciones}</Text>
        </View>
        <View style={{ width: 190, borderTopWidth: 0.75, borderTopColor: TINTA, paddingTop: 4, marginTop: 12 }}>
          <Text>
            <Text style={s.negrita}>{d.emisor.firmante}</Text>
            {d.emisor.cargo ? <Text style={s.silenciado}> · {d.emisor.cargo}</Text> : null}
          </Text>
          <Text>
            <Text style={s.negrita}>{d.emisor.razonSocial}</Text>
            {d.emisor.ruc ? <Text style={s.silenciado}> · RUC {d.emisor.ruc}</Text> : null}
          </Text>
        </View>
      </View>
    </Hoja>
  );
}

/* ------------------------------------------------------------------ */
/* Hoja 2 · Inversión y crédito fiscal                                 */
/* ------------------------------------------------------------------ */

function HojaInversion({ d }: { d: DatosLiquidacion }) {
  const { liquidacion: l, gastos: g, creditoFiscal: cf, totales: t } = d.resultado;
  const { tipoCambio: tc, recuperaCreditoFiscal } = d.config;
  const x = resumirInversion(d.resultado, d.config);

  const composicion = [
    { etiqueta: "Mercadería (FOB)", valor: l.fob },
    { etiqueta: "Flete y seguro", valor: l.flete + l.primaNeta },
    { etiqueta: "Ad Valorem / ISC", valor: l.adValorem + l.isc },
    { etiqueta: "Gastos en destino (neto)", valor: g.afectos + g.noAfectos },
    { etiqueta: "Crédito fiscal (IGV, IPM, percepción)", valor: cf.total },
  ].map((c, i) => ({ ...c, color: i === 4 ? VERDE : [COLORES[0], COLORES[1], COLORES[3], COLORES[4]][i] }));
  const capital = t.capitalRequerido;
  const fraccionCosto = recuperaCreditoFiscal && capital ? t.costoTotal / capital : 1;

  const componentes = [
    { etiqueta: "IGV pagado en aduanas", valor: cf.igvAduanas * tc, color: VERDE },
    { etiqueta: "IPM pagado en aduanas", valor: cf.ipm * tc, color: VERDE },
    { etiqueta: "Percepción del IGV", valor: cf.percepcion * tc, color: VERDE },
    { etiqueta: "IGV de facturas de la agencia", valor: cf.igvGastos * tc, color: VERDE },
  ];

  return (
    <Hoja d={d}>
      <Text style={s.tituloHoja}>Tu inversión de un vistazo</Text>
      <Text style={s.subtituloHoja}>Cuánto dinero necesitas, cuánto es costo real y cuánto te devuelve el crédito fiscal.</Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Kpi etiqueta="Inversión total (importe depositado)" valor={pen(t.capitalRequeridoPen)} detalle={usd(capital)} color="#ffffff" fondo={NAVY} />
        <Kpi etiqueta="Costo real puesto en almacén" valor={pen(t.costoTotalPen)} detalle={`Factor ${factor(t.factorImportacion)} sobre el FOB`} />
        <Kpi
          etiqueta="Crédito fiscal recuperable"
          valor={pen(x.creditoDisponiblePen)}
          detalle={recuperaCreditoFiscal ? "Vuelve a ti al vender con IGV" : "No aplica: importación sin crédito"}
          color={VERDE}
          fondo={FONDO_VERDE}
        />
      </View>

      <View style={[s.tarjeta, { marginTop: 10 }]} wrap={false}>
        <Text style={s.tarjetaTitulo}>Inversión total = costo de tu mercadería + crédito fiscal que recuperas</Text>
        <View style={{ flexDirection: "row", height: 18, borderRadius: 3, marginTop: 6 }}>
          <View style={{ width: `${fraccionCosto * 100}%`, backgroundColor: COLORES[0], borderRadius: 3 }} />
          {fraccionCosto < 1 ? <View style={{ width: `${(1 - fraccionCosto) * 100}%`, backgroundColor: VERDE, borderRadius: 3 }} /> : null}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text>
            <Text style={[s.negrita, { color: COLORES[0] }]}>Costo {pct(fraccionCosto)}</Text>
            <Text style={s.silenciado}>  {pen(t.costoTotalPen)}</Text>
          </Text>
          {fraccionCosto < 1 ? (
            <Text>
              <Text style={[s.negrita, { color: VERDE }]}>Crédito fiscal {pct(1 - fraccionCosto)}</Text>
              <Text style={s.silenciado}>  {pen(x.creditoDisponiblePen)}</Text>
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }} wrap={false}>
        <View style={[s.tarjeta, { flex: 1.15 }]}>
          <Text style={s.tarjetaTitulo}>¿A dónde va cada sol que inviertes?</Text>
          <Text style={s.tarjetaNota}>Reparto del importe total depositado.</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Donut partes={composicion} />
            <View style={{ flex: 1, gap: 4 }}>
              {composicion.map((c) => (
                <View key={c.etiqueta} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{ width: 7, height: 7, borderRadius: 1.5, backgroundColor: c.color, marginRight: 5, marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.silenciado, { fontSize: 7.5 }]}>{c.etiqueta}</Text>
                    <Text style={s.negrita}>
                      {pen(c.valor * tc)} <Text style={[s.silenciado, { fontFamily: "Helvetica" }]}>{pct(capital ? c.valor / capital : 0)}</Text>
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={[s.tarjeta, { flex: 1 }]}>
          <Text style={s.tarjetaTitulo}>Crédito fiscal generado</Text>
          <Text style={s.tarjetaNota}>Impuestos que adelantas y que no son costo.</Text>
          <BarrasH filas={componentes} formato={pen} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.75, borderTopColor: LINEA, marginTop: 8, paddingTop: 5 }}>
            <Text style={s.negrita}>Total generado</Text>
            <Text style={[s.negrita, { color: VERDE }]}>{pen(cf.totalPen)}</Text>
          </View>
        </View>
      </View>

      <View style={[s.tarjeta, { marginTop: 10 }]} wrap={false}>
        <Text style={s.tarjetaTitulo}>Crédito fiscal utilizado con tus ventas</Text>
        <Text style={s.tarjetaNota}>
          Si vendes todo el lote al precio sugerido, cobras IGV a tus clientes y lo compensas con el crédito de esta importación.
        </Text>
        {recuperaCreditoFiscal ? (
          <>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Kpi etiqueta="IGV que cobrarás en tus ventas" valor={pen(x.igvVentasPen)} />
              <Kpi etiqueta="Crédito fiscal utilizado" valor={pen(x.creditoUtilizadoPen)} color={VERDE} fondo={FONDO_VERDE} />
              {x.saldoAFavorPen > 0.005 ? (
                <Kpi etiqueta="Saldo a favor para meses siguientes" valor={pen(x.saldoAFavorPen)} color={AZUL} />
              ) : (
                <Kpi etiqueta="IGV neto a pagar tras compensar" valor={pen(x.igvNetoPorPagarPen)} />
              )}
            </View>
            <View style={{ marginTop: 9 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text style={s.silenciado}>Uso del crédito fiscal</Text>
                <Text style={[s.negrita, { color: VERDE }]}>{pct(x.usoCredito)}</Text>
              </View>
              <Barra fraccion={x.usoCredito} color={VERDE} alto={11} />
            </View>
          </>
        ) : (
          <Text style={s.silenciado}>
            Esta importación se costeó sin recuperar crédito fiscal: IGV, IPM y percepción ya están sumados al costo de cada producto.
          </Text>
        )}
      </View>
    </Hoja>
  );
}

/* ------------------------------------------------------------------ */
/* Hoja 3 · Rentabilidad                                               */
/* ------------------------------------------------------------------ */

function HojaRentabilidad({ d }: { d: DatosLiquidacion }) {
  const { totales: t, items } = d.resultado;
  const x = resumirInversion(d.resultado, d.config);
  const nombres = Object.fromEntries(d.items.map((it) => [it.id, it]));
  const top = [...items].sort((a, b) => b.gananciaTotalPen - a.gananciaTotalPen).slice(0, TOP_SKUS);
  const nombreSku = (r: ResultadoItem) => {
    const it = nombres[r.id];
    return recortar([it?.partNumber, it?.descripcion].filter(Boolean).join(" · ") || "SKU", 40);
  };

  return (
    <Hoja d={d}>
      <Text style={s.tituloHoja}>Rentabilidad de tu importación</Text>
      <Text style={s.subtituloHoja}>
        Proyección vendiendo todo el lote con el margen definido ({pct(d.config.margenGlobal)} sobre el precio, salvo SKUs con margen propio).
      </Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Kpi etiqueta="Ventas estimadas (sin IGV)" valor={pen(t.ingresoTotalPen)} />
        <Kpi etiqueta="Utilidad bruta" valor={pen(t.gananciaTotalPen)} color={VERDE} fondo={FONDO_VERDE} />
        <Kpi etiqueta="Margen real" valor={pct(t.margenReal)} detalle="Utilidad / ventas" />
        <Kpi etiqueta="Retorno sobre el costo" valor={pct(x.roi)} detalle="Utilidad / costo en almacén" color={AZUL} />
      </View>

      <View style={[s.tarjeta, { marginTop: 10 }]} wrap={false}>
        <Text style={s.tarjetaTitulo}>Inversión vs. retorno</Text>
        <Text style={s.tarjetaNota}>Todo en soles y en la misma escala.</Text>
        <BarrasH
          formato={pen}
          filas={[
            { etiqueta: "Inversión total depositada", valor: t.capitalRequeridoPen, color: NAVY },
            { etiqueta: "Costo real puesto en almacén", valor: t.costoTotalPen, color: COLORES[0] },
            { etiqueta: "Ventas estimadas (sin IGV)", valor: t.ingresoTotalPen, color: COLORES[1] },
            { etiqueta: "Crédito fiscal recuperado", valor: x.creditoUtilizadoPen, color: COLORES[3] },
            { etiqueta: "Utilidad bruta", valor: t.gananciaTotalPen, color: VERDE },
          ]}
        />
      </View>

      <View style={[s.tarjeta, { marginTop: 10 }]} wrap={false}>
        <Text style={s.tarjetaTitulo}>Punto de equilibrio</Text>
        <Text style={s.tarjetaNota}>
          Recuperas el costo de la mercadería al vender el {pct(x.ventaParaEquilibrio)} del lote; todo lo que vendas después es utilidad.
        </Text>
        <View style={{ flexDirection: "row", height: 16 }}>
          <View style={{ width: `${x.ventaParaEquilibrio * 100}%`, backgroundColor: COLORES[0], borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }} />
          <View style={{ width: `${(1 - x.ventaParaEquilibrio) * 100}%`, backgroundColor: VERDE, borderTopRightRadius: 3, borderBottomRightRadius: 3 }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={[s.negrita, { color: COLORES[0] }]}>Recupero de costo {pct(x.ventaParaEquilibrio)}</Text>
          <Text style={[s.negrita, { color: VERDE }]}>Zona de utilidad {pct(1 - x.ventaParaEquilibrio)}</Text>
        </View>
      </View>

      {top.length > 0 ? (
        <View style={[s.tarjeta, { marginTop: 10 }]} wrap={false}>
          <Text style={s.tarjetaTitulo}>
            {items.length > TOP_SKUS ? `Los ${TOP_SKUS} productos que más utilidad aportan` : "Utilidad por producto"}
          </Text>
          <Text style={s.tarjetaNota}>Utilidad total por SKU y su margen sobre el precio.</Text>
          <Ranking
            formato={pen}
            filas={top.map((r, i) => ({ etiqueta: nombreSku(r), valor: r.gananciaTotalPen, color: i === 0 ? VERDE : "#7fcfb0", nota: pct(r.margen) }))}
          />
        </View>
      ) : null}
    </Hoja>
  );
}

/* ------------------------------------------------------------------ */
/* Hoja 4+ · Costeo en destino y prorrateo                             */
/* ------------------------------------------------------------------ */

const COLS_PRORRATEO: Columna[] = [
  { ancho: "38%", alinear: "left" },
  { ancho: "14%", alinear: "right" },
  { ancho: "16%", alinear: "left" },
  { ancho: "12%", alinear: "right" },
  { ancho: "20%", alinear: "left" },
];

const COLS_SKU: Columna[] = [
  { ancho: "12%", alinear: "left" },
  { ancho: "20%", alinear: "left" },
  { ancho: "7%", alinear: "right" },
  { ancho: "10%", alinear: "right" },
  { ancho: "10%", alinear: "right" },
  { ancho: "9%", alinear: "right" },
  { ancho: "10%", alinear: "right" },
  { ancho: "11%", alinear: "right" },
  { ancho: "11%", alinear: "right" },
];

function HojaGastosDestino({ d }: { d: DatosLiquidacion }) {
  const { liquidacion: l, gastos: g } = d.resultado;
  const metodo = Object.fromEntries(d.gastos.map((x) => [x.id, x.metodo]));
  const filas = [
    { id: "flete", concepto: "Flete internacional", monto: l.flete, metodo: d.config.metodoProrrateoFlete, afecto: false },
    ...g.lineas
      .filter((x) => x.monto > 0)
      .map((x) => ({ id: x.id, concepto: x.concepto || "Gasto sin nombre", monto: x.monto, metodo: metodo[x.id] ?? "valor_fob", afecto: x.afectoIgv })),
  ].filter((f) => f.monto > 0);
  const total = filas.reduce((a, f) => a + f.monto, 0);
  const max = Math.max(...filas.map((f) => f.monto), 0);

  return (
    <Hoja d={d}>
      <Text style={s.tituloHoja}>Costeo en destino y prorrateo</Text>
      <Text style={s.subtituloHoja}>
        Gastos cotizados por la agencia de carga y cómo se reparten entre tus productos para llegar al costo unitario.
      </Text>

      <View style={s.tabla}>
        <Encabezados cols={COLS_PRORRATEO} titulos={["Concepto", "Monto US$", "Se reparte por", "% del total", "Peso relativo"]} />
        {filas.map((f) => (
          <Fila
            key={f.id}
            cols={COLS_PRORRATEO}
            celdas={[
              f.afecto ? f.concepto : `${f.concepto} (inafecto)`,
              usd(f.monto),
              ETIQUETA_METODO[f.metodo],
              pct(total ? f.monto / total : 0),
              <Barra key="b" fraccion={max ? f.monto / max : 0} color={f.id === "flete" ? COLORES[1] : COLORES[0]} alto={7} />,
            ]}
          />
        ))}
        <Fila cols={COLS_PRORRATEO} celdas={["Total a prorratear", usd(total), "", "100 %", ""]} estilo={s.trTotal} />
      </View>

      <View style={[s.tarjeta, { marginTop: 12, backgroundColor: FONDO, borderColor: FONDO }]} wrap={false}>
        <Text style={s.tarjetaTitulo}>¿Cómo se calcula tu costo unitario?</Text>
        <Text style={s.silenciado}>
          {"Cada gasto se reparte entre los productos según su base (valor FOB, peso, volumen o unidades). A cada SKU se le suman su parte de flete, seguro, Ad Valorem y gastos en destino; el IGV, el IPM y la percepción no se suman porque son crédito fiscal. El resultado dividido entre las unidades es el costo unitario puesto en tu almacén."}
        </Text>
      </View>
    </Hoja>
  );
}

function HojaSkus({ d, filas, n, total }: { d: DatosLiquidacion; filas: ResultadoItem[]; n: number; total: number }) {
  const { totales: t, liquidacion: l, gastos: g } = d.resultado;
  const nombres = Object.fromEntries(d.items.map((it) => [it.id, it]));
  return (
    <Hoja d={d}>
      <Text style={s.tituloHoja}>Prorrateo por producto{total > 1 ? ` (${n + 1}/${total})` : ""}</Text>
      <Text style={s.subtituloHoja}>Montos en US$ salvo el costo unitario, en soles.</Text>
      <View style={[s.tabla, { fontSize: 7 }]}>
        <Encabezados
          cols={COLS_SKU}
          titulos={["Part number", "Descripción", "Cant.", "FOB", "Flete + seg.", "ADV", "Gastos dest.", "Costo total", "C. unit. S/"]}
          estilo={{ fontSize: 6.5 }}
        />
        {filas.map((r) => {
          const it = nombres[r.id];
          return (
            <Fila
              key={r.id}
              cols={COLS_SKU}
              celdas={[
                recortar(it?.partNumber || "—", 14),
                recortar(it?.descripcion ?? "", 22),
                num(it?.cantidad ?? 0),
                dec2(r.fob),
                dec2(r.flete + r.seguro),
                dec2(r.adValorem + r.isc),
                dec2(r.gastos),
                dec2(r.costoTotal),
                pen(r.costoUnitarioPen),
              ]}
            />
          );
        })}
        {n === total - 1 ? (
          <Fila
            cols={COLS_SKU}
            estilo={s.trTotal}
            celdas={[
              "Total",
              "",
              num(t.unidades),
              dec2(l.fob),
              dec2(l.flete + l.primaNeta),
              dec2(l.adValorem + l.isc),
              dec2(g.afectos + g.noAfectos),
              dec2(t.costoTotal),
              "",
            ]}
          />
        ) : null}
      </View>
    </Hoja>
  );
}

/* ------------------------------------------------------------------ */
/* Documento                                                           */
/* ------------------------------------------------------------------ */

export function LiquidacionPdf({ d }: { d: DatosLiquidacion }) {
  const paginas: ResultadoItem[][] = [];
  for (let i = 0; i < d.resultado.items.length; i += FILAS_SKU) {
    paginas.push(d.resultado.items.slice(i, i + FILAS_SKU));
  }
  return (
    <Document
      title={`Liquidación ${d.opciones.numero} · ${d.datosGenerales.importadorRazonSocial || d.datosGenerales.nombre || "Operación"}`}
      author={d.emisor.razonSocial || d.emisor.marca}
      language="es"
    >
      <HojaLiquidacion d={d} />
      <HojaInversion d={d} />
      <HojaRentabilidad d={d} />
      <HojaGastosDestino d={d} />
      {paginas.map((filas, n) => (
        <HojaSkus key={n} d={d} filas={filas} n={n} total={paginas.length} />
      ))}
    </Document>
  );
}

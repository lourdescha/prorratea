"use client";

import { useState } from "react";
import { FileBadgeIcon, FileDownIcon, Loader2Icon, PrinterIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { selectResultado, useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";
import { CampoNumero, CampoSelect, CampoTexto } from "../../campos";
import { nombreArchivo } from "../boton-descargar-pdf";
import {
  CONDICIONES_POR_DEFECTO,
  EMISOR_POR_DEFECTO,
  guardarEmisor,
  leerEmisor,
  numeroLiquidacion,
  REGIMENES,
  type DatosEmisor,
  type OpcionesLiquidacion,
} from "./datos-liquidacion";

type Modo = "descargar" | "imprimir";

const OPCIONES_REGIMEN = REGIMENES.map((r) => ({ valor: r as string, etiqueta: r }));

const CAMPOS_EMISOR: { k: keyof DatosEmisor; etiqueta: string }[] = [
  { k: "marca", etiqueta: "Marca (logo)" },
  { k: "lema", etiqueta: "Lema" },
  { k: "razonSocial", etiqueta: "Razón social" },
  { k: "ruc", etiqueta: "RUC" },
  { k: "telefono", etiqueta: "Teléfono" },
  { k: "correo", etiqueta: "Correo" },
  { k: "web", etiqueta: "Web" },
  { k: "firmante", etiqueta: "Firma" },
  { k: "cargo", etiqueta: "Cargo" },
];

/**
 * Liquidación Oficial para entregar al cliente: hoja 1 con la liquidación en
 * formato corporativo y hojas 2+ con el dashboard de inversión y rentabilidad.
 */
export function BotonLiquidacion() {
  const [abierto, setAbierto] = useState(false);
  const [generando, setGenerando] = useState<Modo | null>(null);
  const [emisor, setEmisor] = useState<DatosEmisor>(EMISOR_POR_DEFECTO);
  const [opciones, setOpciones] = useState<OpcionesLiquidacion>({
    numero: "",
    regimen: REGIMENES[0],
    atencion: "",
    vigenciaDias: 7,
    condiciones: CONDICIONES_POR_DEFECTO,
  });
  const dg = useNuevoProyectoStore((s) => s.datosGenerales);
  const setDatosGenerales = useNuevoProyectoStore((s) => s.setDatosGenerales);
  const sinItems = useNuevoProyectoStore((s) => s.itemIds.length === 0);

  const setOpcion = (patch: Partial<OpcionesLiquidacion>) => setOpciones((o) => ({ ...o, ...patch }));

  const alAbrir = (open: boolean) => {
    if (open) {
      setEmisor(leerEmisor());
      setOpcion({ numero: numeroLiquidacion() });
    }
    setAbierto(open);
  };

  const generar = async (modo: Modo) => {
    // La pestaña se abre antes del await: si no, el navegador la bloquea como popup
    const ventana = modo === "imprimir" ? window.open("", "_blank") : null;
    setGenerando(modo);
    try {
      guardarEmisor(emisor);
      const [{ pdf }, { LiquidacionPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./liquidacion-pdf"),
      ]);
      const s = useNuevoProyectoStore.getState();
      const blob = await pdf(
        <LiquidacionPdf
          d={{
            datosGenerales: s.datosGenerales,
            config: s.config,
            items: s.itemIds.map((id) => s.items[id]),
            gastos: s.gastoIds.map((id) => s.gastos[id]),
            resultado: selectResultado(s),
            generadoEl: new Date(),
            emisor,
            opciones,
          }}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      if (ventana) {
        ventana.location.href = url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = nombreArchivo(`${opciones.numero} ${s.datosGenerales.importadorRazonSocial || s.datosGenerales.nombre}`, "liquidacion");
        a.click();
      }
      // La pestaña de impresión necesita el blob mientras carga el visor
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setAbierto(false);
    } catch (e) {
      ventana?.close();
      console.error(e);
      toast.error("No se pudo generar la liquidación", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setGenerando(null);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={alAbrir}>
      <DialogTrigger render={<Button className="bg-brand text-brand-foreground hover:bg-brand/90" disabled={sinItems} />}>
        <FileBadgeIcon /> Generar Liquidación Oficial
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Liquidación Oficial para tu cliente</DialogTitle>
          <DialogDescription>
            Hoja 1: la liquidación con valores, tributos, gastos en destino e importe total depositado. Hojas 2 en adelante:
            inversión, crédito fiscal, rentabilidad y prorrateo, con gráficos.
          </DialogDescription>
        </DialogHeader>

        <section className="grid gap-3 sm:grid-cols-2">
          <h3 className="text-sm font-semibold sm:col-span-2">Cliente</h3>
          <CampoTexto
            etiqueta="Razón social"
            valor={dg.importadorRazonSocial}
            onCambio={(v) => setDatosGenerales({ importadorRazonSocial: v })}
            placeholder="Empresa importadora S.A.C."
          />
          <CampoTexto etiqueta="RUC" valor={dg.importadorRuc} onCambio={(v) => setDatosGenerales({ importadorRuc: v })} />
          <CampoTexto etiqueta="Atención (contacto)" valor={opciones.atencion} onCambio={(v) => setOpcion({ atencion: v })} />
          <CampoSelect etiqueta="Régimen aduanero" valor={opciones.regimen} opciones={OPCIONES_REGIMEN} onCambio={(v) => setOpcion({ regimen: v })} />
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <h3 className="text-sm font-semibold sm:col-span-2">Liquidación</h3>
          <CampoTexto etiqueta="N° de liquidación" valor={opciones.numero} onCambio={(v) => setOpcion({ numero: v })} />
          <CampoNumero etiqueta="Vigencia" sufijo="días" valor={opciones.vigenciaDias} onCambio={(v) => setOpcion({ vigenciaDias: Math.round(v) })} />
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="condiciones-liquidacion">Condiciones</Label>
            <Textarea
              id="condiciones-liquidacion"
              rows={3}
              value={opciones.condiciones}
              onChange={(e) => setOpcion({ condiciones: e.target.value })}
            />
          </div>
        </section>

        <details className="rounded-lg border px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold">
            Tu empresa: {emisor.marca || "sin marca"}{" "}
            <span className="font-normal text-muted-foreground">(se recuerda en este navegador)</span>
          </summary>
          <div className="grid gap-3 pt-3 pb-1 sm:grid-cols-2">
            {CAMPOS_EMISOR.map((c) => (
              <CampoTexto
                key={c.k}
                etiqueta={c.etiqueta}
                valor={emisor[c.k]}
                onCambio={(v) => setEmisor((e) => ({ ...e, [c.k]: v }))}
              />
            ))}
          </div>
        </details>

        <DialogFooter>
          <Button variant="outline" onClick={() => generar("imprimir")} disabled={generando !== null}>
            {generando === "imprimir" ? <Loader2Icon className="animate-spin" /> : <PrinterIcon />}
            Abrir para imprimir
          </Button>
          <Button onClick={() => generar("descargar")} disabled={generando !== null}>
            {generando === "descargar" ? <Loader2Icon className="animate-spin" /> : <FileDownIcon />}
            {generando === "descargar" ? "Generando…" : "Descargar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNuevoProyectoStore, type DatosGenerales } from "@/stores/nuevo-proyecto.store";
import { CampoNumero, CampoSelect, CampoTexto } from "../campos";
import { ParametrosTributarios } from "./parametros-tributarios";

const INCOTERMS = ["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"].map((v) => ({ valor: v, etiqueta: v })) as {
  valor: DatosGenerales["incoterm"];
  etiqueta: string;
}[];
const VIAS = [
  { valor: "maritima", etiqueta: "Marítima" },
  { valor: "aerea", etiqueta: "Aérea" },
  { valor: "terrestre", etiqueta: "Terrestre" },
] as const;

export function PasoDatosGenerales() {
  const d = useNuevoProyectoStore((s) => s.datosGenerales);
  const set = useNuevoProyectoStore((s) => s.setDatosGenerales);
  const tipoCambio = useNuevoProyectoStore((s) => s.config.tipoCambio);
  const setConfig = useNuevoProyectoStore((s) => s.setConfig);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>La operación</CardTitle>
          <CardDescription>Solo el nombre y el tipo de cambio son obligatorios. El resto lo puedes completar después.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <CampoTexto etiqueta="Nombre de la operación *" valor={d.nombre} onCambio={(v) => set({ nombre: v })} placeholder="Importación China — Marzo 2026" />
          <CampoNumero
            etiqueta="Tipo de cambio USD → PEN *"
            valor={tipoCambio}
            onCambio={(v) => setConfig({ tipoCambio: v })}
            ayuda="Usa el de SUNAT / BCR del día de numeración."
          />
          <CampoTexto etiqueta="Proveedor / exportador" valor={d.proveedor} onCambio={(v) => set({ proveedor: v })} />
          <CampoTexto etiqueta="País de origen" valor={d.paisOrigen} onCambio={(v) => set({ paisOrigen: v })} />
          <CampoSelect etiqueta="Incoterm" valor={d.incoterm} opciones={INCOTERMS} onCambio={(v) => set({ incoterm: v })} />
          <CampoSelect etiqueta="Vía de transporte" valor={d.viaTransporte} opciones={VIAS} onCambio={(v) => set({ viaTransporte: v })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importador y despacho</CardTitle>
          <CardDescription>Datos de la DAM. Útiles para el historial y para comparar operaciones.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <CampoTexto etiqueta="Razón social" valor={d.importadorRazonSocial} onCambio={(v) => set({ importadorRazonSocial: v })} />
          <CampoTexto etiqueta="RUC" valor={d.importadorRuc} onCambio={(v) => set({ importadorRuc: v.replace(/\D/g, "").slice(0, 11) })} />
          <CampoTexto etiqueta="N.° de DAM" valor={d.numeroDam} onCambio={(v) => set({ numeroDam: v })} placeholder="DAM-2026-000001" />
          <CampoTexto etiqueta="Fecha de numeración" valor={d.fechaNumeracion} onCambio={(v) => set({ fechaNumeracion: v })} placeholder="AAAA-MM-DD" />
          <CampoTexto etiqueta="Puerto de embarque" valor={d.puertoEmbarque} onCambio={(v) => set({ puertoEmbarque: v })} />
          <CampoTexto etiqueta="Puerto de destino" valor={d.puertoDestino} onCambio={(v) => set({ puertoDestino: v })} />
          <CampoTexto etiqueta="Agente de aduanas" valor={d.agenteAduanas} onCambio={(v) => set({ agenteAduanas: v })} />
          <CampoSelect
            etiqueta="Canal de control"
            valor={d.canalControl ?? ""}
            opciones={[
              { valor: "", etiqueta: "Aún no asignado" },
              { valor: "verde", etiqueta: "Verde" },
              { valor: "naranja", etiqueta: "Naranja" },
              { valor: "rojo", etiqueta: "Rojo" },
            ]}
            onCambio={(v) => set({ canalControl: v || null })}
          />
        </CardContent>
      </Card>

      <ParametrosTributarios />
    </div>
  );
}

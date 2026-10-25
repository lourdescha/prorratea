"use client";

import { useState } from "react";
import { FileDownIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { selectResultado, useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";

const nombreArchivo = (nombre: string) =>
  `reporte-${
    nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "operacion"
  }.pdf`;

/** Genera el PDF en el navegador; la librería se descarga solo al primer clic. */
export function BotonDescargarPdf() {
  const [generando, setGenerando] = useState(false);

  const descargar = async () => {
    setGenerando(true);
    try {
      const [{ pdf }, { ReportePdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./reporte-pdf"),
      ]);
      const s = useNuevoProyectoStore.getState();
      const blob = await pdf(
        <ReportePdf
          d={{
            datosGenerales: s.datosGenerales,
            config: s.config,
            items: s.itemIds.map((id) => s.items[id]),
            resultado: selectResultado(s),
            generadoEl: new Date(),
          }}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo(s.datosGenerales.nombre);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar el PDF", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Button variant="outline" onClick={descargar} disabled={generando}>
      {generando ? <Loader2Icon className="animate-spin" /> : <FileDownIcon />}
      {generando ? "Generando…" : "Descargar Reporte (PDF)"}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { ClipboardPasteIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { parsearTablaPegada } from "@/lib/parsear-tabla-pegada";
import { MAX_SKUS, useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";

/** Copiar el rango de la factura en Excel → pegar aquí. Reemplaza el tipeo de 500 filas. */
export function PegarDesdeExcel() {
  const [texto, setTexto] = useState("");
  const agregarItems = useNuevoProyectoStore((s) => s.agregarItems);

  const importar = () => {
    const filas = parsearTablaPegada(texto);
    if (filas.length === 0) {
      toast.error("No encontramos filas válidas. Revisa el orden de las columnas.");
      return;
    }
    const agregados = agregarItems(filas);
    setTexto("");
    if (agregados < filas.length) {
      toast.warning(`Se agregaron ${agregados} de ${filas.length} SKUs: el límite es ${MAX_SKUS} por operación.`);
    } else {
      toast.success(`${agregados} SKUs agregados.`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pega tu factura desde Excel</CardTitle>
        <CardDescription>
          Copia las columnas en este orden: <strong>Part number · Descripción · Unidad · Cantidad · FOB unitario (USD)</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={4}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={"AF1698\tCase Transparente TPU iPhone 15\tUnid.\t480\t1.21"}
          className="font-mono text-xs"
        />
        <Button onClick={importar} disabled={!texto.trim()}>
          <ClipboardPasteIcon /> Agregar SKUs
        </Button>
      </CardContent>
    </Card>
  );
}

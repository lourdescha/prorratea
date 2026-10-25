"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CopyIcon, FolderOpenIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHistorialLocalStore, type CotizacionGuardada } from "@/stores/historial-local.store";
import { useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";
import { pen } from "../nuevo-proyecto/formato";
import { confirmarDescartarBorrador } from "./confirmar-descarte";

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function ListaCotizaciones() {
  const router = useRouter();
  const cotizaciones = useHistorialLocalStore((s) => s.cotizaciones);
  const hidratado = useHistorialLocalStore((s) => s.hidratado);
  const hidratar = useHistorialLocalStore((s) => s.hidratar);
  const eliminar = useHistorialLocalStore((s) => s.eliminar);

  useEffect(() => hidratar(), [hidratar]);

  const abrir = async (c: CotizacionGuardada, duplicar: boolean) => {
    if (!(await confirmarDescartarBorrador())) return;
    useNuevoProyectoStore.getState().cargarOperacion({
      // Duplicar = cotización nueva: sin id (se crea al guardar) y sin DAM
      proyectoId: duplicar ? null : c.id,
      datosGenerales: duplicar
        ? { ...c.datosGenerales, nombre: `${c.datosGenerales.nombre || "Cotización"} (copia)`, numeroDam: "" }
        : c.datosGenerales,
      config: c.config,
      items: c.items,
      gastos: c.gastos,
    });
    router.push("/proyectos/nuevo");
  };

  const quitar = (c: CotizacionGuardada) => {
    if (!window.confirm(`¿Eliminar "${c.datosGenerales.nombre || "Cotización sin nombre"}" de tu historial?`)) return;
    eliminar(c.id);
    // Si era la que está abierta en el asistente, ese borrador pasa a ser una cotización nueva
    const store = useNuevoProyectoStore.getState();
    if (store.proyectoId === c.id) useNuevoProyectoStore.setState({ proyectoId: null, estadoGuardado: "idle" });
    toast.success("Cotización eliminada");
  };

  if (!hidratado) return null;

  if (cotizaciones.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">Aún no tienes cotizaciones guardadas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Completa los 4 pasos y pulsa <span className="font-medium">Guardar operación</span> en Resultados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {cotizaciones.map((c) => (
        <li key={c.id}>
          <Card>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="truncate font-semibold text-brand">{c.datosGenerales.nombre || "Cotización sin nombre"}</p>
                <p className="text-xs text-muted-foreground">
                  {[c.datosGenerales.numeroDam && `DAM ${c.datosGenerales.numeroDam}`, c.datosGenerales.proveedor, `${c.resumen.skus} SKUs`, `Guardada ${fecha(c.guardadoEl)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <dl className="flex gap-6 text-sm sm:text-right">
                <div>
                  <dt className="text-xs text-muted-foreground">Costo total</dt>
                  <dd className="font-medium tabular-nums">{pen(c.resumen.costoTotalPen)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Capital requerido</dt>
                  <dd className="font-medium tabular-nums">{pen(c.resumen.capitalRequeridoPen)}</dd>
                </div>
              </dl>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => abrir(c, false)}>
                  <FolderOpenIcon /> Abrir
                </Button>
                <Button size="sm" variant="outline" onClick={() => abrir(c, true)}>
                  <CopyIcon /> Duplicar
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Eliminar ${c.datosGenerales.nombre}`}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => quitar(c)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

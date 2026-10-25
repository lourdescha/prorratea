"use client";

import { memo } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useGasto, useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";
import { InputNumero } from "../campos";

export const FilaGasto = memo(function FilaGasto({ id }: { id: string }) {
  const gasto = useGasto(id);
  const actualizar = useNuevoProyectoStore((s) => s.actualizarGasto);
  const eliminar = useNuevoProyectoStore((s) => s.eliminarGasto);
  if (!gasto) return null;

  return (
    // Móvil: concepto en su propia línea y debajo monto · IGV · quitar
    <div className="grid grid-cols-[1fr_auto_36px] items-center gap-2 border-b pb-3 last:border-b-0 sm:grid-cols-[1fr_140px_90px_36px] sm:border-b-0 sm:pb-0">
      <Input aria-label="Concepto" className="col-span-3 sm:col-span-1" value={gasto.concepto} onChange={(e) => actualizar(id, { concepto: e.target.value })} />
      <InputNumero aria-label={`Monto ${gasto.concepto}`} valor={gasto.monto} onCambio={(v) => actualizar(id, { monto: v })} />
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-xs text-muted-foreground sm:hidden">IGV</span>
        <Switch
          aria-label={`${gasto.concepto} afecto a IGV`}
          checked={gasto.afectoIgv}
          onCheckedChange={(v) => actualizar(id, { afectoIgv: v })}
        />
      </div>
      <Button variant="ghost" size="icon" aria-label={`Quitar ${gasto.concepto}`} onClick={() => eliminar(id)}>
        <XIcon />
      </Button>
    </div>
  );
});

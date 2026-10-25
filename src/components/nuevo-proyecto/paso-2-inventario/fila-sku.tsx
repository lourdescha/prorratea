"use client";

import { memo } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { useItem, useNuevoProyectoStore, useResultadoItem } from "@/stores/nuevo-proyecto.store";
import { InputNumero } from "../campos";
import { pen, usd } from "../formato";

export const FilaSku = memo(function FilaSku({ id, indice }: { id: string; indice: number }) {
  const item = useItem(id);
  const resultado = useResultadoItem(id);
  const actualizar = useNuevoProyectoStore((s) => s.actualizarItem);
  const eliminar = useNuevoProyectoStore((s) => s.eliminarItems);
  if (!item) return null;

  return (
    <TableRow>
      <TableCell className="text-muted-foreground tabular-nums">{indice + 1}</TableCell>
      <TableCell>
        <Input aria-label="Part number" value={item.partNumber} onChange={(e) => actualizar(id, { partNumber: e.target.value })} />
      </TableCell>
      <TableCell>
        <Input aria-label="Descripción" value={item.descripcion} onChange={(e) => actualizar(id, { descripcion: e.target.value })} />
      </TableCell>
      <TableCell>
        <InputNumero aria-label="Cantidad" valor={item.cantidad} onCambio={(v) => actualizar(id, { cantidad: v })} />
      </TableCell>
      <TableCell>
        <InputNumero aria-label="FOB unitario" valor={item.fobUnitario} onCambio={(v) => actualizar(id, { fobUnitario: v })} />
      </TableCell>
      <TableCell>
        <InputNumero aria-label="Ad Valorem %" escala={100} valor={item.tasaAdValorem} onCambio={(v) => actualizar(id, { tasaAdValorem: v })} />
      </TableCell>
      <TableCell className="text-right tabular-nums">{usd(resultado?.fob ?? 0)}</TableCell>
      <TableCell className="text-right font-medium tabular-nums">{pen(resultado?.costoUnitarioPen ?? 0)}</TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" aria-label="Eliminar SKU" onClick={() => eliminar([id])}>
          <Trash2Icon />
        </Button>
      </TableCell>
    </TableRow>
  );
});

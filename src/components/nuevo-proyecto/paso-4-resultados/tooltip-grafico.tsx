import type { ReactNode } from "react";

/** Fila de tooltip: muestra + etiqueta + valor formateado (para `ChartTooltipContent formatter`). */
export function filaTooltip(etiqueta: ReactNode, color: string | undefined, valor: string, detalle?: string) {
  return (
    <div className="flex w-full items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: color }} />
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="ml-auto pl-3 font-medium text-foreground tabular-nums">{valor}</span>
      {detalle && <span className="text-muted-foreground tabular-nums">{detalle}</span>}
    </div>
  );
}

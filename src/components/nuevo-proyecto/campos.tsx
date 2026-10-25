"use client";

import { useId, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CampoBase {
  etiqueta: string;
  ayuda?: ReactNode;
  className?: string;
}

function Campo({ etiqueta, ayuda, className, children, id }: CampoBase & { id: string; children: ReactNode }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

export function CampoTexto({
  valor,
  onCambio,
  placeholder,
  ...base
}: CampoBase & { valor: string; onCambio: (v: string) => void; placeholder?: string }) {
  const id = useId();
  return (
    <Campo id={id} {...base}>
      <Input id={id} value={valor} placeholder={placeholder} onChange={(e) => onCambio(e.target.value)} />
    </Campo>
  );
}

/**
 * Input numérico que mantiene el texto mientras se escribe ("0.", "1,5") y solo
 * publica al store cuando el valor es válido. `escala=100` muestra fracciones como %.
 */
export function InputNumero({
  valor,
  onCambio,
  escala = 1,
  className,
  ...props
}: {
  valor: number;
  onCambio: (v: number) => void;
  escala?: number;
  className?: string;
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  const mostrado = texto ?? (valor ? String(Number((valor * escala).toPrecision(12))) : "");
  return (
    <Input
      {...props}
      inputMode="decimal"
      className={cn("text-right tabular-nums", className)}
      value={mostrado}
      placeholder="0"
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const t = e.target.value;
        setTexto(t);
        const n = Number(t.replace(",", "."));
        if (t === "") onCambio(0);
        else if (Number.isFinite(n)) onCambio(n / escala);
      }}
      onBlur={() => setTexto(null)}
    />
  );
}

export function CampoNumero({
  valor,
  onCambio,
  escala,
  sufijo,
  disabled,
  ...base
}: CampoBase & { valor: number; onCambio: (v: number) => void; escala?: number; sufijo?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <Campo id={id} {...base}>
      <div className="relative">
        <InputNumero id={id} valor={valor} onCambio={onCambio} escala={escala} disabled={disabled} className={sufijo ? "pr-10" : undefined} />
        {sufijo && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {sufijo}
          </span>
        )}
      </div>
    </Campo>
  );
}

export function CampoSelect<T extends string>({
  valor,
  onCambio,
  opciones,
  ...base
}: CampoBase & { valor: T; onCambio: (v: T) => void; opciones: readonly { valor: T; etiqueta: string }[] }) {
  const id = useId();
  return (
    <Campo id={id} {...base}>
      <select
        id={id}
        value={valor}
        onChange={(e) => onCambio(e.target.value as T)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </Campo>
  );
}

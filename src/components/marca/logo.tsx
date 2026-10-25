import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Isotipo de Prorratea: el bloque sólido es el contenedor de la importación;
 * la diagonal lo conecta con barras ascendentes (el costo que se reparte entre
 * los SKUs), en degradado índigo → naranja.
 */
export function Isotipo({ className }: { className?: string }) {
  const id = useId();
  const degradado = `prorratea-${id}`;
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id={degradado} x1="14" y1="36" x2="38" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#312E81" />
          <stop offset="0.4" stopColor="#7C3AED" />
          <stop offset="0.9" stopColor="#F97316" />
        </linearGradient>
      </defs>
      {/* Contenedor */}
      <rect x="2" y="19" width="15" height="17" rx="3" fill="#312E81" />
      <path d="M7 23v9M12 23v9" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
      {/* Diagonal que conecta el contenedor con las barras */}
      <path d="M15 21 L37 5" stroke={`url(#${degradado})`} strokeWidth="3" strokeLinecap="round" />
      {/* Barras ascendentes */}
      <rect x="20" y="22" width="4.5" height="14" rx="1.5" fill={`url(#${degradado})`} />
      <rect x="26.5" y="16" width="4.5" height="20" rx="1.5" fill={`url(#${degradado})`} />
      <rect x="33" y="11" width="4.5" height="25" rx="1.5" fill={`url(#${degradado})`} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Isotipo />
      <div className="leading-tight">
        <div className="text-lg font-bold tracking-tight text-brand">Prorratea</div>
        <div className="text-xs text-muted-foreground">Costeo de Importaciones</div>
      </div>
    </div>
  );
}

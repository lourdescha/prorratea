"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ENLACES = [
  { href: "/proyectos/nuevo", texto: "Cotizar" },
  { href: "/proyectos", texto: "Mis cotizaciones" },
];

export function NavPrincipal() {
  const ruta = usePathname();
  return (
    <nav aria-label="Principal" className="flex items-center gap-1">
      {ENLACES.map((e) => {
        const activo = ruta === e.href;
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              activo ? "bg-accent text-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {e.texto}
          </Link>
        );
      })}
    </nav>
  );
}

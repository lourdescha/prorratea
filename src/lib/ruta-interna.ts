const RUTA_POR_DEFECTO = "/proyectos/nuevo";

/** Solo acepta rutas relativas del propio sitio (evita open redirects vía ?next=). */
export function rutaInterna(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return RUTA_POR_DEFECTO;
  }
  return next;
}

// Tras iniciar sesión se muestra la portada con las instrucciones del taller
const RUTA_POR_DEFECTO = "/";

/** Solo acepta rutas relativas del propio sitio (evita open redirects vía ?next=). */
export function rutaInterna(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return RUTA_POR_DEFECTO;
  }
  return next;
}

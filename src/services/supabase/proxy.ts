import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const RUTAS_PUBLICAS = ["/login", "/auth"];

/**
 * Refresca el token de sesión en cada request. Sin sesión, todo (incluida la
 * portada "/") lleva al login; con sesión, el login lleva a la portada.
 */
export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Permite probar el asistente en local antes de crear el proyecto de Supabase.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV === "development") {
    console.warn("[proxy] Supabase no configurado (.env.local): auth desactivada en desarrollo.");
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const { pathname } = request.nextUrl;
  const esPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  const redirigir = (destino: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = search;
    const redireccion = NextResponse.redirect(url);
    // Conserva las cookies de sesión que Supabase pudo haber refrescado
    response.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
    return redireccion;
  };

  if (!data?.claims && !esPublica) {
    return redirigir("/login", pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`);
  }
  if (data?.claims && pathname === "/login") return redirigir("/");
  return response;
}

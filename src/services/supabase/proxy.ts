import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const RUTAS_PUBLICAS = ["/login", "/auth"];

/** Refresca el token de sesión en cada request y redirige a /login si no hay usuario. */
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
  const esPublica = RUTAS_PUBLICAS.some((r) => request.nextUrl.pathname.startsWith(r));

  if (!data?.claims && !esPublica && request.nextUrl.pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

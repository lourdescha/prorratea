import { NextResponse, type NextRequest } from "next/server";
import { rutaInterna } from "@/lib/ruta-interna";
import { createClient } from "@/services/supabase/server";

/** Destino del enlace de confirmación de correo: canjea el código PKCE por una sesión. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const siguiente = rutaInterna(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${siguiente}`);
  }
  return NextResponse.redirect(`${origin}/login?error=confirmacion`);
}

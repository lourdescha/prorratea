import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/services/supabase/proxy";

// Next.js 16: "middleware" pasó a llamarse "proxy".
export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

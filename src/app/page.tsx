import Link from "next/link";
import { Isotipo } from "@/components/marca/logo";

/** Portada pública del taller. "Comenzar a cotizar" pide iniciar sesión si hace falta. */
export default function PortadaBienvenida() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-linear-to-br from-slate-50 via-indigo-50/30 to-orange-50/30 p-6">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-indigo-100/50 bg-white p-8 text-center shadow-xl md:p-10">
        {/* Detalle decorativo superior */}
        <div className="absolute inset-x-0 top-0 h-2 bg-linear-to-r from-brand to-primary" />

        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-accent p-4 shadow-inner">
            <Isotipo className="size-12" />
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-brand">¡Bienvenida/o a Prorratea!</h1>
        <p className="mb-8 text-muted-foreground">Tu herramienta inteligente para el costeo exacto de importaciones.</p>

        {/* Instrucciones y recomendaciones */}
        <div className="mb-8 rounded-xl border border-orange-200/60 bg-orange-50/60 p-5 text-left">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold tracking-wider text-orange-900 uppercase">
            <span aria-hidden>📌</span> Instrucciones para el taller:
          </h2>
          <ul className="space-y-2 text-sm text-orange-950/80">
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-600" aria-hidden>•</span>
              <span>
                <strong>Uso exclusivo del taller:</strong> Esta cuenta es de acceso general para la práctica en vivo. No
                compartas las credenciales fuera del espacio de clase.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-600" aria-hidden>•</span>
              <span>
                <strong>Tus reportes:</strong> Recuerda descargar tus resultados o notas al terminar cada ejercicio; el
                historial se almacena de forma local en tu navegador.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-600" aria-hidden>•</span>
              <span>
                <strong>Soporte:</strong> Si tienes dudas durante los cálculos, mantente atento a las indicaciones en
                pantalla.
              </span>
            </li>
          </ul>
        </div>

        <Link
          href="/proyectos/nuevo"
          className="inline-block w-full rounded-xl bg-linear-to-r from-indigo-600 to-indigo-700 px-8 py-4 text-center text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:from-indigo-700 hover:to-indigo-800 focus-visible:ring-4 focus-visible:ring-indigo-300 focus-visible:outline-none"
        >
          Comenzar a Cotizar <span aria-hidden>🚀</span>
        </Link>
      </div>

      <footer className="mt-8 text-xs text-muted-foreground">Prorratea © 2026 — Todos los derechos reservados.</footer>
    </main>
  );
}

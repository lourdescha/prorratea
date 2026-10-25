import { BotonNuevaOperacion } from "@/components/operaciones/boton-nueva-operacion";
import { ListaCotizaciones } from "@/components/operaciones/lista-cotizaciones";

export const metadata = { title: "Mis cotizaciones · Prorratea" };

export default function MisCotizacionesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand">Mis cotizaciones</h1>
          <p className="text-sm text-muted-foreground">
            Se guardan solo en este navegador: nadie más que use la cuenta puede verlas.
          </p>
        </div>
        <BotonNuevaOperacion />
      </div>
      <ListaCotizaciones />
    </main>
  );
}

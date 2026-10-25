import { AsistenteNuevoProyecto } from "@/components/nuevo-proyecto/asistente-nuevo-proyecto";

export default function NuevoProyectoPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-brand">Nuevo proyecto de importación</h1>
      <AsistenteNuevoProyecto />
    </main>
  );
}

import { AsistenteNuevoProyecto } from "@/components/nuevo-proyecto/asistente-nuevo-proyecto";
import { TituloAsistente } from "@/components/nuevo-proyecto/titulo-asistente";

export default function NuevoProyectoPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-10">
      <TituloAsistente />
      <AsistenteNuevoProyecto />
    </main>
  );
}

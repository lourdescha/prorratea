import { useNuevoProyectoStore } from "@/stores/nuevo-proyecto.store";

/**
 * true si se puede reemplazar el borrador: está vacío, ya está guardado
 * o el usuario confirma descartar sus cambios.
 */
export async function confirmarDescartarBorrador(): Promise<boolean> {
  if (!useNuevoProyectoStore.persist.hasHydrated()) await useNuevoProyectoStore.persist.rehydrate();
  const s = useNuevoProyectoStore.getState();
  const conCambios = s.itemIds.length > 0 && s.estadoGuardado !== "guardado";
  return !conCambios || window.confirm("Tu borrador actual tiene cambios sin guardar. ¿Reemplazarlo de todos modos?");
}

import { selectResultado, type NuevoProyectoState, type Paso } from "./nuevo-proyecto.store";

const RUC_VALIDO = /^(10|15|17|20)\d{9}$/;

/** Errores que bloquean avanzar desde un paso. Vacío = puede continuar. */
export function validarPaso(paso: Paso, s: NuevoProyectoState): string[] {
  const errores: string[] = [];
  switch (paso) {
    case 1: {
      const d = s.datosGenerales;
      if (!d.nombre.trim()) errores.push("Ponle un nombre a la operación.");
      if (d.importadorRuc && !RUC_VALIDO.test(d.importadorRuc)) {
        errores.push("El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20.");
      }
      if (!(s.config.tipoCambio > 0)) errores.push("Ingresa el tipo de cambio USD → PEN.");
      break;
    }
    case 2: {
      const r = selectResultado(s);
      if (s.itemIds.length === 0) errores.push("Agrega o pega al menos un SKU.");
      const incompletos = r.advertencias.filter(
        (a) => a.codigo === "item_sin_cantidad" || a.codigo === "item_sin_precio",
      ).length;
      if (incompletos > 0) errores.push(`${incompletos} SKU(s) sin cantidad o FOB unitario.`);
      break;
    }
    case 3:
      if (!(s.config.fleteInternacional >= 0)) errores.push("El flete no puede ser negativo.");
      break;
  }
  return errores;
}

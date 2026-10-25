/**
 * Alias de dominio sobre los tipos generados desde la base real.
 * No editar database.generated.ts a mano: regenerar con `npm run gen:types`.
 */
import type { Enums, Tables } from "./database.generated";

export type { Database, Json } from "./database.generated";

export type RolOrganizacion = Enums<"rol_organizacion">;
export type MetodoProrrateoDb = Enums<"metodo_prorrateo">;
export type CategoriaGastoDb = Enums<"categoria_gasto">;

export type OrganizacionRow = Tables<"organizaciones">;
export type MiembroRow = Tables<"miembros_organizacion">;
export type OperacionRow = Tables<"operaciones_importacion">;
export type ItemRow = Tables<"items_operacion">;
export type GastoRow = Tables<"gastos_operacion">;

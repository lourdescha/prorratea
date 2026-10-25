-- =====================================================================
-- Costeo de importaciones — esquema multi-tenant (Fase 2)
-- Modelo derivado del Excel maestro "CCI" (Datos Generales, Factura
-- Comercial, Gastos Importación, Tributos Aduana, Precio de Venta).
--
-- Tenancy: toda fila de negocio pertenece a una ORGANIZACIÓN. Los usuarios
-- acceden por membresía con rol (owner | admin | editor | viewer).
-- RLS en todas las tablas; las funciones auxiliares viven en el schema
-- `private`, que no está expuesto por la API de Supabase.
-- =====================================================================

create schema if not exists private;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.rol_organizacion as enum ('owner', 'admin', 'editor', 'viewer');
create type public.estado_operacion as enum ('borrador', 'calculada', 'cerrada');
create type public.metodo_prorrateo as enum ('valor_fob', 'peso', 'volumen', 'unidades');
create type public.categoria_gasto as enum ('operador_logistico', 'administrativo', 'financiero');
create type public.via_transporte as enum ('maritima', 'aerea', 'terrestre');
create type public.canal_control as enum ('verde', 'naranja', 'rojo');
create type public.modo_seguro as enum ('monto', 'tasa');
create type public.incoterm as enum ('EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP');

-- ---------------------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------------------
create table public.organizaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  plan text not null default 'free',
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.miembros_organizacion (
  organizacion_id uuid not null references public.organizaciones (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rol public.rol_organizacion not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (organizacion_id, user_id)
);
create index miembros_organizacion_user_idx on public.miembros_organizacion (user_id);

-- ---------------------------------------------------------------------
-- Catálogos por organización (reutilizables entre operaciones)
-- ---------------------------------------------------------------------

-- Una organización (p. ej. agencia de aduanas) puede importar para varios RUC.
create table public.importadores (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id) on delete cascade,
  razon_social text not null,
  ruc char(11) not null check (ruc ~ '^(10|15|17|20)[0-9]{9}$'),
  -- 3.5 % frecuente | 10 % primera importación | 5 % bienes usados
  tasa_percepcion_default numeric(6, 4) not null default 0.035
    check (tasa_percepcion_default between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizacion_id, ruc)
);

create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id) on delete cascade,
  nombre text not null,
  pais text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizacion_id, nombre)
);

-- Maestro de SKUs: el "Code / Número de parte" identifica el producto entre importaciones.
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id) on delete cascade,
  part_number text not null check (length(trim(part_number)) > 0),
  descripcion text not null default '',
  unidad text not null default 'Unid.',
  partida_arancelaria varchar(10) check (partida_arancelaria ~ '^[0-9]{4,10}$'),
  tasa_ad_valorem numeric(6, 4) not null default 0.06 check (tasa_ad_valorem between 0 and 1),
  tasa_isc numeric(6, 4) not null default 0 check (tasa_isc between 0 and 1),
  peso_kg_unitario numeric(14, 4) not null default 0 check (peso_kg_unitario >= 0),
  volumen_m3_unitario numeric(14, 6) not null default 0 check (volumen_m3_unitario >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizacion_id, part_number)
);

-- ---------------------------------------------------------------------
-- Operación de importación (= un archivo Excel / una DAM)
-- ---------------------------------------------------------------------
create table public.operaciones_importacion (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id) on delete cascade,
  importador_id uuid references public.importadores (id) on delete set null,
  proveedor_id uuid references public.proveedores (id) on delete set null,
  estado public.estado_operacion not null default 'borrador',

  -- Datos de la operación (hoja "Datos Generales")
  nombre text not null check (length(trim(nombre)) > 0),
  numero_dam text,
  importador_razon_social text,
  importador_ruc char(11) check (importador_ruc ~ '^(10|15|17|20)[0-9]{9}$'),
  fecha_numeracion date,
  pais_origen text,
  proveedor_nombre text,
  incoterm public.incoterm not null default 'FOB',
  via_transporte public.via_transporte not null default 'maritima',
  puerto_embarque text,
  puerto_destino text,
  agente_aduanas text,
  canal_control public.canal_control,

  -- Parámetros de costeo (snapshot por operación: las tasas pueden cambiar en el tiempo)
  tipo_cambio numeric(10, 4) not null check (tipo_cambio > 0),
  flete_internacional numeric(14, 2) not null default 0 check (flete_internacional >= 0),
  metodo_prorrateo_flete public.metodo_prorrateo not null default 'valor_fob',
  tasa_igv numeric(6, 4) not null default 0.16,
  tasa_ipm numeric(6, 4) not null default 0.02,
  tasa_percepcion numeric(6, 4) not null default 0.035,
  tasa_igv_servicios numeric(6, 4) not null default 0.18,
  redondeo_sunat boolean not null default true,
  seguro_modo public.modo_seguro not null default 'monto',
  seguro_prima_neta numeric(14, 2) not null default 0 check (seguro_prima_neta >= 0),
  seguro_tasa_prima numeric(6, 4) not null default 0,
  seguro_tasa_deducible numeric(6, 4) not null default 0 check (seguro_tasa_deducible < 1),
  seguro_tasa_derecho_emision numeric(6, 4) not null default 0,
  agente_calculo_automatico boolean not null default true,
  agente_tasa_comision numeric(6, 4) not null default 0.01,
  agente_minimo_pen numeric(10, 2) not null default 100,
  recupera_credito_fiscal boolean not null default true,
  margen_global numeric(6, 4) not null default 0.40 check (margen_global >= 0 and margen_global < 1),

  -- Resultado del motor al guardar (KPIs para listados/dashboards sin recalcular)
  resultado jsonb,
  calculado_at timestamptz,

  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (id, organizacion_id)
);
create index operaciones_org_idx on public.operaciones_importacion (organizacion_id, updated_at desc);
create unique index operaciones_dam_unq on public.operaciones_importacion (organizacion_id, numero_dam)
  where numero_dam is not null and numero_dam <> '';

-- Líneas de la Factura Comercial (hasta 500 por operación)
create table public.items_operacion (
  id uuid primary key,
  operacion_id uuid not null,
  organizacion_id uuid not null,
  producto_id uuid references public.productos (id) on delete set null,
  posicion integer not null check (posicion >= 0),
  part_number text not null default '',
  descripcion text not null default '',
  unidad text not null default 'Unid.',
  cantidad numeric(14, 4) not null check (cantidad >= 0),
  fob_unitario numeric(16, 6) not null check (fob_unitario >= 0),
  partida_arancelaria varchar(10),
  tasa_ad_valorem numeric(6, 4) not null default 0.06 check (tasa_ad_valorem between 0 and 1),
  tasa_isc numeric(6, 4) not null default 0 check (tasa_isc between 0 and 1),
  peso_kg_unitario numeric(14, 4) not null default 0 check (peso_kg_unitario >= 0),
  volumen_m3_unitario numeric(14, 6) not null default 0 check (volumen_m3_unitario >= 0),
  -- null = usa margen_global de la operación
  margen numeric(6, 4) check (margen is null or (margen >= 0 and margen < 1)),
  -- Snapshot del motor al guardar (historial de costos por part number)
  costo_unitario_usd numeric(18, 6),
  costo_unitario_pen numeric(18, 6),
  -- Garantiza que el item pertenece al mismo tenant que su operación
  foreign key (operacion_id, organizacion_id)
    references public.operaciones_importacion (id, organizacion_id) on delete cascade
);
create index items_operacion_op_idx on public.items_operacion (operacion_id, posicion);
create index items_operacion_part_idx on public.items_operacion (organizacion_id, part_number);

-- Gastos de importación (tercer elemento del costo)
create table public.gastos_operacion (
  id uuid primary key,
  operacion_id uuid not null,
  organizacion_id uuid not null,
  posicion integer not null default 0,
  concepto text not null,
  categoria public.categoria_gasto not null default 'operador_logistico',
  monto numeric(14, 2) not null default 0 check (monto >= 0),
  afecto_igv boolean not null default true,
  metodo public.metodo_prorrateo not null default 'valor_fob',
  notas text,
  foreign key (operacion_id, organizacion_id)
    references public.operaciones_importacion (id, organizacion_id) on delete cascade
);
create index gastos_operacion_op_idx on public.gastos_operacion (operacion_id, posicion);

-- Límite de negocio: máximo 500 SKUs por operación
create function private.validar_limite_items() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.items_operacion where operacion_id = new.operacion_id) > 500 then
    raise exception 'Una operación admite como máximo 500 SKUs' using errcode = 'check_violation';
  end if;
  return null;
end $$;
create constraint trigger items_operacion_limite
  after insert on public.items_operacion
  deferrable initially deferred
  for each row execute function private.validar_limite_items();

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create function private.tocar_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger organizaciones_updated_at before update on public.organizaciones
  for each row execute function private.tocar_updated_at();
create trigger importadores_updated_at before update on public.importadores
  for each row execute function private.tocar_updated_at();
create trigger proveedores_updated_at before update on public.proveedores
  for each row execute function private.tocar_updated_at();
create trigger productos_updated_at before update on public.productos
  for each row execute function private.tocar_updated_at();
create trigger operaciones_updated_at before update on public.operaciones_importacion
  for each row execute function private.tocar_updated_at();

-- ---------------------------------------------------------------------
-- Helpers de autorización (security definer: evitan recursión de RLS)
-- ---------------------------------------------------------------------
create function private.es_miembro(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros_organizacion m
    where m.organizacion_id = org and m.user_id = (select auth.uid())
  );
$$;

create function private.tiene_rol(org uuid, roles public.rol_organizacion[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros_organizacion m
    where m.organizacion_id = org and m.user_id = (select auth.uid()) and m.rol = any (roles)
  );
$$;

create function private.puede_editar(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.tiene_rol(org, array['owner', 'admin', 'editor']::public.rol_organizacion[]);
$$;

create function private.es_admin(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.tiene_rol(org, array['owner', 'admin']::public.rol_organizacion[]);
$$;

grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

-- Quien crea una organización queda como owner.
create function private.agregar_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.miembros_organizacion (organizacion_id, user_id, rol)
  values (new.id, new.created_by, 'owner');
  return new;
end $$;
create trigger organizaciones_agregar_owner after insert on public.organizaciones
  for each row execute function private.agregar_owner();

-- Una organización nunca se queda sin owner.
create function private.proteger_ultimo_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.rol = 'owner'
     and (tg_op = 'DELETE' or new.rol <> 'owner')
     and not exists (
       select 1 from public.miembros_organizacion
       where organizacion_id = old.organizacion_id and rol = 'owner' and user_id <> old.user_id
     )
     -- permitir el borrado en cascada cuando se elimina la organización completa
     and exists (select 1 from public.organizaciones where id = old.organizacion_id)
  then
    raise exception 'La organización debe tener al menos un owner';
  end if;
  return coalesce(new, old);
end $$;
create trigger miembros_proteger_owner before update or delete on public.miembros_organizacion
  for each row execute function private.proteger_ultimo_owner();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.organizaciones enable row level security;
alter table public.miembros_organizacion enable row level security;
alter table public.importadores enable row level security;
alter table public.proveedores enable row level security;
alter table public.productos enable row level security;
alter table public.operaciones_importacion enable row level security;
alter table public.items_operacion enable row level security;
alter table public.gastos_operacion enable row level security;

-- Organizaciones
-- created_by permite que `insert ... returning` funcione antes de que exista la membresía
create policy "miembros ven su organización" on public.organizaciones
  for select to authenticated
  using ((select private.es_miembro(id)) or created_by = (select auth.uid()));
create policy "usuarios crean organizaciones propias" on public.organizaciones
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "admins editan la organización" on public.organizaciones
  for update to authenticated
  using ((select private.es_admin(id))) with check ((select private.es_admin(id)));
create policy "owners eliminan la organización" on public.organizaciones
  for delete to authenticated
  using ((select private.tiene_rol(id, array['owner']::public.rol_organizacion[])));

-- Miembros: todos ven al equipo; solo admins gestionan; solo owners otorgan "owner".
create policy "miembros ven al equipo" on public.miembros_organizacion
  for select to authenticated using ((select private.es_miembro(organizacion_id)));
create policy "admins agregan miembros" on public.miembros_organizacion
  for insert to authenticated with check (
    (select private.es_admin(organizacion_id))
    and (rol <> 'owner' or (select private.tiene_rol(organizacion_id, array['owner']::public.rol_organizacion[])))
  );
create policy "admins cambian roles" on public.miembros_organizacion
  for update to authenticated
  using ((select private.es_admin(organizacion_id)))
  with check (
    (select private.es_admin(organizacion_id))
    and (rol <> 'owner' or (select private.tiene_rol(organizacion_id, array['owner']::public.rol_organizacion[])))
  );
create policy "admins quitan miembros o uno mismo sale" on public.miembros_organizacion
  for delete to authenticated
  using ((select private.es_admin(organizacion_id)) or user_id = (select auth.uid()));

-- Tablas de negocio: miembros leen, owner/admin/editor escriben.
do $$
declare t text;
begin
  foreach t in array array[
    'importadores', 'proveedores', 'productos',
    'operaciones_importacion', 'items_operacion', 'gastos_operacion'
  ] loop
    execute format(
      'create policy "miembros leen" on public.%I for select to authenticated
         using ((select private.es_miembro(organizacion_id)))', t);
    execute format(
      'create policy "editores crean" on public.%I for insert to authenticated
         with check ((select private.puede_editar(organizacion_id)))', t);
    execute format(
      'create policy "editores modifican" on public.%I for update to authenticated
         using ((select private.puede_editar(organizacion_id)))
         with check ((select private.puede_editar(organizacion_id)))', t);
    execute format(
      'create policy "editores eliminan" on public.%I for delete to authenticated
         using ((select private.puede_editar(organizacion_id)))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Guardado atómico de una operación completa (cabecera + SKUs + gastos)
-- security invoker: se aplican las políticas RLS del usuario que llama.
-- ---------------------------------------------------------------------
create function public.guardar_operacion(p_operacion jsonb, p_items jsonb, p_gastos jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v public.operaciones_importacion;
begin
  v := jsonb_populate_record(null::public.operaciones_importacion, p_operacion);
  if v.id is null or v.organizacion_id is null then
    raise exception 'p_operacion requiere id y organizacion_id';
  end if;
  if jsonb_array_length(coalesce(p_items, '[]')) > 500 then
    raise exception 'Una operación admite como máximo 500 SKUs';
  end if;

  insert into public.operaciones_importacion as o (
    id, organizacion_id, importador_id, proveedor_id, estado, nombre, numero_dam,
    importador_razon_social, importador_ruc, fecha_numeracion, pais_origen, proveedor_nombre,
    incoterm, via_transporte, puerto_embarque, puerto_destino, agente_aduanas, canal_control,
    tipo_cambio, flete_internacional, metodo_prorrateo_flete, tasa_igv, tasa_ipm, tasa_percepcion,
    tasa_igv_servicios, redondeo_sunat, seguro_modo, seguro_prima_neta, seguro_tasa_prima,
    seguro_tasa_deducible, seguro_tasa_derecho_emision, agente_calculo_automatico,
    agente_tasa_comision, agente_minimo_pen, recupera_credito_fiscal, margen_global,
    resultado, calculado_at
  ) values (
    v.id, v.organizacion_id, v.importador_id, v.proveedor_id, coalesce(v.estado, 'borrador'),
    v.nombre, v.numero_dam, v.importador_razon_social, v.importador_ruc, v.fecha_numeracion,
    v.pais_origen, v.proveedor_nombre, coalesce(v.incoterm, 'FOB'),
    coalesce(v.via_transporte, 'maritima'), v.puerto_embarque, v.puerto_destino, v.agente_aduanas,
    v.canal_control, v.tipo_cambio, coalesce(v.flete_internacional, 0),
    coalesce(v.metodo_prorrateo_flete, 'valor_fob'), coalesce(v.tasa_igv, 0.16),
    coalesce(v.tasa_ipm, 0.02), coalesce(v.tasa_percepcion, 0.035),
    coalesce(v.tasa_igv_servicios, 0.18), coalesce(v.redondeo_sunat, true),
    coalesce(v.seguro_modo, 'monto'), coalesce(v.seguro_prima_neta, 0),
    coalesce(v.seguro_tasa_prima, 0), coalesce(v.seguro_tasa_deducible, 0),
    coalesce(v.seguro_tasa_derecho_emision, 0), coalesce(v.agente_calculo_automatico, true),
    coalesce(v.agente_tasa_comision, 0.01), coalesce(v.agente_minimo_pen, 100),
    coalesce(v.recupera_credito_fiscal, true), coalesce(v.margen_global, 0.40),
    v.resultado, case when v.resultado is not null then now() end
  )
  on conflict (id) do update set
    importador_id = excluded.importador_id,
    proveedor_id = excluded.proveedor_id,
    estado = excluded.estado,
    nombre = excluded.nombre,
    numero_dam = excluded.numero_dam,
    importador_razon_social = excluded.importador_razon_social,
    importador_ruc = excluded.importador_ruc,
    fecha_numeracion = excluded.fecha_numeracion,
    pais_origen = excluded.pais_origen,
    proveedor_nombre = excluded.proveedor_nombre,
    incoterm = excluded.incoterm,
    via_transporte = excluded.via_transporte,
    puerto_embarque = excluded.puerto_embarque,
    puerto_destino = excluded.puerto_destino,
    agente_aduanas = excluded.agente_aduanas,
    canal_control = excluded.canal_control,
    tipo_cambio = excluded.tipo_cambio,
    flete_internacional = excluded.flete_internacional,
    metodo_prorrateo_flete = excluded.metodo_prorrateo_flete,
    tasa_igv = excluded.tasa_igv,
    tasa_ipm = excluded.tasa_ipm,
    tasa_percepcion = excluded.tasa_percepcion,
    tasa_igv_servicios = excluded.tasa_igv_servicios,
    redondeo_sunat = excluded.redondeo_sunat,
    seguro_modo = excluded.seguro_modo,
    seguro_prima_neta = excluded.seguro_prima_neta,
    seguro_tasa_prima = excluded.seguro_tasa_prima,
    seguro_tasa_deducible = excluded.seguro_tasa_deducible,
    seguro_tasa_derecho_emision = excluded.seguro_tasa_derecho_emision,
    agente_calculo_automatico = excluded.agente_calculo_automatico,
    agente_tasa_comision = excluded.agente_tasa_comision,
    agente_minimo_pen = excluded.agente_minimo_pen,
    recupera_credito_fiscal = excluded.recupera_credito_fiscal,
    margen_global = excluded.margen_global,
    resultado = excluded.resultado,
    calculado_at = excluded.calculado_at
  -- no permite mover una operación a otra organización
  where o.organizacion_id = excluded.organizacion_id;

  if not found then
    raise exception 'Operación no encontrada o sin permisos' using errcode = 'insufficient_privilege';
  end if;

  -- Reemplazo completo de líneas dentro de la misma transacción
  delete from public.items_operacion where operacion_id = v.id;
  insert into public.items_operacion (
    id, operacion_id, organizacion_id, producto_id, posicion, part_number, descripcion, unidad,
    cantidad, fob_unitario, partida_arancelaria, tasa_ad_valorem, tasa_isc, peso_kg_unitario,
    volumen_m3_unitario, margen, costo_unitario_usd, costo_unitario_pen
  )
  select
    i.id, v.id, v.organizacion_id, i.producto_id, i.posicion, coalesce(i.part_number, ''),
    coalesce(i.descripcion, ''), coalesce(i.unidad, 'Unid.'), i.cantidad, i.fob_unitario,
    nullif(i.partida_arancelaria, ''), coalesce(i.tasa_ad_valorem, 0.06), coalesce(i.tasa_isc, 0),
    coalesce(i.peso_kg_unitario, 0), coalesce(i.volumen_m3_unitario, 0), i.margen,
    i.costo_unitario_usd, i.costo_unitario_pen
  from jsonb_populate_recordset(null::public.items_operacion, coalesce(p_items, '[]')) as i;

  delete from public.gastos_operacion where operacion_id = v.id;
  insert into public.gastos_operacion (
    id, operacion_id, organizacion_id, posicion, concepto, categoria, monto, afecto_igv, metodo, notas
  )
  select
    g.id, v.id, v.organizacion_id, coalesce(g.posicion, 0), g.concepto,
    coalesce(g.categoria, 'operador_logistico'), coalesce(g.monto, 0),
    coalesce(g.afecto_igv, true), coalesce(g.metodo, 'valor_fob'), g.notas
  from jsonb_populate_recordset(null::public.gastos_operacion, coalesce(p_gastos, '[]')) as g;

  return v.id;
end $$;

revoke execute on function public.guardar_operacion(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.guardar_operacion(jsonb, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Historial de costo por número de parte (comparar operaciones)
-- security_invoker: respeta el RLS de quien consulta.
-- ---------------------------------------------------------------------
create view public.historial_costos_producto with (security_invoker = true) as
select
  i.organizacion_id,
  i.part_number,
  i.descripcion,
  o.id as operacion_id,
  o.nombre as operacion,
  o.numero_dam,
  o.fecha_numeracion,
  o.proveedor_nombre,
  o.tipo_cambio,
  i.cantidad,
  i.fob_unitario,
  i.costo_unitario_usd,
  i.costo_unitario_pen,
  case when i.fob_unitario > 0 then i.costo_unitario_usd / i.fob_unitario end as factor_importacion
from public.items_operacion i
join public.operaciones_importacion o on o.id = i.operacion_id
where i.part_number <> '';

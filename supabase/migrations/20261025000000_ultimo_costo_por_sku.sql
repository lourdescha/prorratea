-- =====================================================================
-- Último costo unitario conocido por Part Number (alerta de historial en el Paso 4)
-- =====================================================================

-- El usuario puede escribir "fc3457 " o "FC3457": se compara normalizado.
create index items_operacion_part_norm_idx
  on public.items_operacion (organizacion_id, upper(btrim(part_number)))
  where part_number <> '' and costo_unitario_pen is not null;

/**
 * Para cada Part Number pedido, la compra más reciente de la organización
 * (por fecha de numeración de la DAM, o la fecha de creación si no la tiene).
 * security invoker: las políticas RLS siguen filtrando lo que el usuario puede ver.
 */
create function public.ultimo_costo_por_part_number(
  p_organizacion_id uuid,
  p_part_numbers text[],
  p_excluir_operacion uuid default null
)
returns table (
  part_number text,
  costo_unitario_pen numeric,
  fecha date,
  operacion text,
  numero_dam text
)
language sql stable security invoker set search_path = '' as $$
  select distinct on (upper(btrim(i.part_number)))
    upper(btrim(i.part_number)),
    i.costo_unitario_pen,
    coalesce(o.fecha_numeracion, o.created_at::date),
    o.nombre,
    o.numero_dam
  from public.items_operacion i
  join public.operaciones_importacion o on o.id = i.operacion_id
  where i.organizacion_id = p_organizacion_id
    and i.part_number <> ''
    and i.costo_unitario_pen is not null
    and upper(btrim(i.part_number)) = any (
      select upper(btrim(x)) from unnest(p_part_numbers) as x
    )
    and (p_excluir_operacion is null or i.operacion_id <> p_excluir_operacion)
  order by upper(btrim(i.part_number)),
    coalesce(o.fecha_numeracion, o.created_at::date) desc,
    o.created_at desc;
$$;

revoke execute on function public.ultimo_costo_por_part_number(uuid, text[], uuid) from public, anon;
grant execute on function public.ultimo_costo_por_part_number(uuid, text[], uuid) to authenticated;

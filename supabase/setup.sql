-- =====================================================================
-- BioRoute · Configuración de Supabase
-- Pegar COMPLETO en Supabase → SQL Editor → New query → Run.
-- Se puede ejecutar más de una vez sin problema.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) Formulario de contacto (/contacto)
--    La web solo puede INSERTAR mensajes; nadie puede leerlos desde fuera.
--    Se ven en Supabase → Table Editor → contact_submissions.
-- ---------------------------------------------------------------------
create table if not exists contact_submissions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table contact_submissions enable row level security;

drop policy if exists "web can insert" on contact_submissions;
create policy "web can insert" on contact_submissions
  for insert to anon with check (true);


-- ---------------------------------------------------------------------
-- 2) Simulador (/simulador)
--    Una fila por visita; se actualiza mientras la persona completa datos
--    y al final se agrega su contacto.
--    Se ven en Supabase → Table Editor → simulator_submissions.
-- ---------------------------------------------------------------------
create table if not exists simulator_submissions (
  id uuid primary key,
  inputs jsonb not null,
  results jsonb,
  contact jsonb,
  language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sin políticas: nadie puede leer ni escribir la tabla directamente desde la web.
alter table simulator_submissions enable row level security;

-- La web solo puede guardar/actualizar la fila de su propia visita (id aleatorio).
create or replace function save_simulation(
  p_id uuid, p_inputs jsonb, p_results jsonb, p_contact jsonb, p_language text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if pg_column_size(p_inputs) > 20000 or pg_column_size(p_contact) > 5000 then
    raise exception 'payload too large';
  end if;
  insert into simulator_submissions (id, inputs, results, contact, language)
  values (p_id, p_inputs, p_results, p_contact, p_language)
  on conflict (id) do update set
    inputs = excluded.inputs,
    results = excluded.results,
    contact = coalesce(excluded.contact, simulator_submissions.contact),
    language = excluded.language,
    updated_at = now();
end;
$$;

revoke all on function save_simulation(uuid, jsonb, jsonb, jsonb, text) from public;
grant execute on function save_simulation(uuid, jsonb, jsonb, jsonb, text) to anon;

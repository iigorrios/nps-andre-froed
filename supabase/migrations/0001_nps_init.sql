-- =============================================================================
-- NPS — Consultoria André Froed (Fase 2)
-- Esquema + Row Level Security (RLS)
--
-- COMO USAR: cole e rode este arquivo no SQL Editor do seu projeto Supabase
-- (Dashboard → SQL Editor → New query → Run).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tabela: profissionais (nutricionistas e personais)
-- ---------------------------------------------------------------------------
create table if not exists public.nps_professionals (
  id          bigint generated always as identity primary key,
  name        text        not null,
  role        text        not null check (role in ('nutricionista', 'personal')),
  photo       text,                       -- data-URL (base64) ou URL; pode ser null
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tabela: respostas da pesquisa (100% anônimas)
-- ---------------------------------------------------------------------------
create table if not exists public.nps_responses (
  id                   bigint generated always as identity primary key,
  professional_id      bigint      not null
    references public.nps_professionals (id) on delete cascade,
  nps_score            smallint    not null check (nps_score between 0 and 10),
  pontualidade         smallint    not null check (pontualidade between 1 and 5),
  clareza              smallint    not null check (clareza between 1 and 5),
  simpatia             smallint    not null check (simpatia between 1 and 5),
  conhecimento_tecnico smallint    not null check (conhecimento_tecnico between 1 and 5),
  comentario           text        default '',
  created_at           timestamptz not null default now()
);

create index if not exists nps_responses_professional_idx
  on public.nps_responses (professional_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.nps_professionals enable row level security;
alter table public.nps_responses     enable row level security;

-- Profissionais: qualquer visitante pode LER a lista (a pesquisa precisa dela).
-- Escrita (insert/update/delete) NÃO é liberada aqui — só a Edge Function
-- (service role), protegida por senha, pode gravar.
drop policy if exists "professionals_public_read" on public.nps_professionals;
create policy "professionals_public_read"
  on public.nps_professionals
  for select
  to anon, authenticated
  using (active = true);

-- Respostas: qualquer visitante pode INSERIR (envio anônimo da pesquisa).
-- Não há policy de SELECT/DELETE para o anon → com RLS ligado, ler e apagar
-- ficam bloqueados. Isso é feito só pelo painel, via Edge Function.
drop policy if exists "responses_public_insert" on public.nps_responses;
create policy "responses_public_insert"
  on public.nps_responses
  for insert
  to anon, authenticated
  with check (true);

-- =============================================================================
-- Seed inicial de profissionais (opcional — pode apagar/editar depois no painel)
-- =============================================================================
insert into public.nps_professionals (name, role) values
  ('Dra. Marina Alves',  'nutricionista'),
  ('Rafael Costa',       'personal'),
  ('Dra. Beatriz Lima',  'nutricionista'),
  ('Lucas Ferreira',     'personal')
on conflict do nothing;

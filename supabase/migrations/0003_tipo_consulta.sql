-- =============================================================================
-- NPS — registrar se a avaliação foi de PRIMEIRA CONSULTA ou de RETORNO
--
-- MOTIVO: a pesquisa já recebia o tipo pela URL (`/?tipo=primeira` ou
-- `?tipo=reavaliacao`) apenas para montar o link do próximo agendamento. Agora
-- o dado também é gravado, para o painel mostrar se um profissional está
-- recebendo mais avaliação de primeira consulta ou de retorno.
--
-- A coluna é NULLABLE de propósito: as respostas anteriores a esta migration
-- não têm essa informação e aparecem no painel como "Não informado".
-- =============================================================================

alter table public.nps_responses
  add column if not exists tipo_consulta text;

-- Constraint em passo separado (add column ... check não é idempotente).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'nps_responses_tipo_consulta_check'
  ) then
    alter table public.nps_responses
      add constraint nps_responses_tipo_consulta_check
      check (tipo_consulta in ('primeira', 'reavaliacao'));
  end if;
end $$;

comment on column public.nps_responses.tipo_consulta is
  'Tipo do atendimento avaliado: primeira | reavaliacao. NULL = resposta '
  'anterior a esta coluna, ou link da pesquisa sem o parametro `tipo`.';

-- O painel filtra e agrupa por este campo.
create index if not exists nps_responses_tipo_consulta_idx
  on public.nps_responses (tipo_consulta);

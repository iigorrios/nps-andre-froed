-- =============================================================================
-- NPS — fotos dos profissionais saem da tabela e vão para o Storage
--
-- MOTIVO: `nps_professionals.photo` guardava data-URLs base64 de ~2,4 MB. Com 7
-- profissionais a tabela tinha 17 MB, e o `listResponses` da Edge Function
-- (que embutia o profissional em cada resposta) montava um payload de ~55 MB,
-- estourando a memória do worker — WORKER_RESOURCE_LIMIT, HTTP 546.
--
-- DEPOIS: `photo` guarda só a URL pública (~96 bytes). Os binários ficam no
-- bucket `nps-photos`, em `professionals/<id>.<ext>`, reduzidos a 256x256 WebP
-- (~11 KB cada) — o painel reduz no navegador antes de enviar e a Edge Function
-- faz o upload.
-- =============================================================================

-- Bucket público das fotos (leitura anônima pela URL pública; a escrita só
-- acontece pela Edge Function, que usa a service role e ignora RLS).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nps-photos', 'nps-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

comment on column public.nps_professionals.photo is
  'URL pública da foto no bucket nps-photos (professionals/<id>.<ext>). '
  'NÃO gravar data-URL base64 aqui: infla a tabela e estoura o worker da Edge Function.';

-- As linhas existentes já foram convertidas (base64 → upload → URL) por uma
-- migração one-shot. Nada a fazer aqui para os dados; só o `vacuum full` abaixo,
-- que devolve ao disco os 17 MB que o base64 ocupava.
--   vacuum full public.nps_professionals;
-- (rode manualmente no SQL Editor — `vacuum` não roda dentro de transação.)

# Fase 2 — Configuração do Supabase

Seu projeto do NPS não está conectado à ferramenta, então aqui vão os passos
para você mesmo aplicar tudo. São **4 passos** (~10 min).

---

## 1. Criar as tabelas + segurança (RLS)

No Dashboard do Supabase → **SQL Editor** → **New query**, cole e rode todo o
conteúdo de [`supabase/migrations/0001_nps_init.sql`](supabase/migrations/0001_nps_init.sql).

Isso cria:
- `nps_professionals` — leitura pública, escrita só via Edge Function.
- `nps_responses` — **inserção** pública (a pesquisa anônima), mas **leitura e
  exclusão bloqueadas** para o público (só o painel acessa).
- 4 profissionais de exemplo (pode apagar/editar depois no painel).

---

## 2. Cadastrar a senha do painel (Secret)

Dashboard → **Edge Functions** → aba **Secrets** (ou **Project Settings → Edge
Functions → Secrets**) → **Add new secret**:

| Name | Value |
|------|-------|
| `ADMIN_PASSWORD` | *a senha que você quiser usar no painel* |

> `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetados automaticamente
> pelo Supabase — **não** precisa cadastrá-los.

---

## 3. Publicar a Edge Function `nps-admin`

O código está em
[`supabase/functions/nps-admin/index.ts`](supabase/functions/nps-admin/index.ts).

**Opção A — CLI (recomendada):**

```bash
npm i -g supabase          # se ainda não tiver
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy nps-admin --no-verify-jwt
```

> O `--no-verify-jwt` é **essencial**: usamos nosso próprio token (a senha), não
> o JWT do Supabase. O arquivo `supabase/config.toml` já deixa isso registrado.

**Opção B — Dashboard:** Edge Functions → Create function → nome `nps-admin` →
cole o conteúdo do `index.ts` → em **Details**, desative **Verify JWT** → Deploy.

---

## 4. Configurar o frontend

Copie `.env.example` para `.env` e preencha com os dados do seu projeto
(Dashboard → **Project Settings → API**):

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

Depois:

```bash
npm install
npm run dev
```

- Pesquisa: <http://localhost:5173/>
- Painel: <http://localhost:5173/admin> (entra com a `ADMIN_PASSWORD`)

---

## Como a segurança funciona

- A **anon key** (pública, no navegador) só consegue **ler profissionais** e
  **inserir respostas** — nunca ler nem apagar respostas. Isso é garantido pelas
  políticas de RLS.
- Tudo que é sensível (ver todas as respostas, excluir, gerir profissionais)
  passa pela Edge Function, que só age depois de validar a senha e roda com a
  `service_role` **no servidor** — a chave secreta nunca vai para o navegador.
- O login troca a senha por um **token assinado** (validade de 12h) guardado no
  `sessionStorage`; a senha em si não fica salva no navegador.

## Dúvidas comuns

- **"Senha incorreta" mesmo com a senha certa** → confira se o secret
  `ADMIN_PASSWORD` foi salvo e se a função foi re-deployada depois disso.
- **Erro de CORS / 401 ao entrar** → a função precisa estar publicada com
  `--no-verify-jwt`.
- **Painel abre mas não carrega respostas** → verifique se a migration do passo 1
  rodou (as tabelas existem) e se o `.env` aponta para o projeto certo.

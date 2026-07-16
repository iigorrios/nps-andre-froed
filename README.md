# NPS — Consultoria André Froed

Pesquisa de satisfação (NPS) anônima para uma consultoria de nutrição e personal
trainer 100% online. Após cada atendimento por videochamada, o cliente recebe um
link único (via WhatsApp) para avaliar o profissional que o atendeu. O painel
`/admin` (protegido por senha) mostra os resultados.

## Stack

- React 18 + Vite
- TailwindCSS (v3)
- React Router (`/`, `/obrigado`, `/admin`)
- **Supabase** — banco (`nps_professionals`, `nps_responses`) + Edge Function
  `nps-admin` para as ações protegidas por senha

## Como rodar

**Antes do primeiro `npm run dev`, configure o Supabase:** siga o
[SUPABASE_SETUP.md](SUPABASE_SETUP.md) (criar tabelas, cadastrar a senha nos
Secrets, publicar a Edge Function e preencher o `.env`).

```bash
npm install
cp .env.example .env   # e preencha as chaves do seu projeto
npm run dev
```

- Pesquisa: <http://localhost:5173/>
- Painel: <http://localhost:5173/admin> (entra com a senha `ADMIN_PASSWORD`)

Outros comandos:

```bash
npm run build     # build de produção
npm run preview   # pré-visualiza o build
```

## Autenticação do painel

Não há usuário/senha nem cadastro. O acesso usa uma **senha única** guardada como
secret `ADMIN_PASSWORD` no Supabase. O login troca a senha por um token assinado
(validade de 12h); a senha nunca fica salva no navegador. Detalhes da segurança
no [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Fluxo da pesquisa (wizard de 4 etapas)

1. **Seleção do profissional** — cartões com nome + especialidade.
2. **NPS (0–10)** — "o quanto indicaria o atendimento de [Profissional]?".
   Escala colorida por faixa (apenas visual; sem rótulos de detrator/neutro/promotor).
3. **Perguntas complementares** — 4 avaliações por estrelas (1–5):
   pontualidade, clareza, simpatia e conhecimento técnico.
4. **Comentário aberto** (opcional) + botão **Enviar avaliação**.
5. **Tela de agradecimento** (`/obrigado`) — sem retorno à pesquisa.

## Estrutura

```
supabase/
  migrations/0001_nps_init.sql   # Tabelas + RLS (rodar no SQL Editor)
  functions/nps-admin/index.ts   # Edge Function: login + ações protegidas
  config.toml                    # verify_jwt = false para a função
src/
  components/
    ProfessionalSelector.jsx     # Etapa 1
    NPSScale.jsx                 # Etapa 2
    ExtraQuestions.jsx           # Etapa 3 (usa StarRating)
    StarRating.jsx / CommentBox.jsx / ProgressBar.jsx / Avatar.jsx
    admin/
      LoginGate.jsx              # Tela de senha
      AdminDashboard.jsx         # Painel autenticado (3 abas)
    dashboard/
      StatTile / NpsDistributionBar / ProfessionalRanking
      ProfessionalDetail / ProfessionalManager / ResponsesTable
  pages/
    SurveyPage.jsx               # Wizard + insert no Supabase
    ThankYouPage.jsx             # Tela de agradecimento
    AdminPage.jsx                # Gate de senha → painel
  lib/
    supabaseClient.js            # Cliente (anon key) + URL da função
    api.js                       # Público: ler profissionais, inserir resposta
    adminAuth.js                 # Login por senha → token de sessão
    adminApi.js                  # Ações admin via Edge Function
    nps.js                       # Agregações de NPS (puras)
  data/professionals.mock.js     # Só ROLE_LABELS + seed de referência
  App.jsx                        # Rotas
  main.jsx                       # Entry point
```

## Trocar a paleta de cores

A identidade visual oficial ainda não existe. As cores da marca estão como
variáveis CSS em [`src/index.css`](src/index.css) (`:root`) e são referenciadas
no [`tailwind.config.js`](tailwind.config.js) como `brand-*` e `accent-*`.
**Para trocar a paleta, basta alterar os valores das variáveis** — nenhum
componente precisa mudar.

## Modelo de dados

Cada resposta gravada em `nps_responses`:

```js
{
  professional_id: 1,
  nps_score: 9,
  pontualidade: 5,
  clareza: 4,
  simpatia: 5,
  conhecimento_tecnico: 5,
  comentario: "Texto opcional",
  created_at: "2026-07-16T12:00:00.000Z"  // preenchido pelo banco
}
```

O painel exclui respostas dadas por engano na aba **Respostas** (via Edge
Function, com confirmação).

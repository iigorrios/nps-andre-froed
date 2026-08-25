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
5. **Tela de agradecimento** (`/obrigado`) — sem retorno à pesquisa, mas com o
   link do **próximo agendamento** da jornada (ver abaixo).

## Link da pesquisa e próximo agendamento

O link enviado ao cliente deve carregar o **tipo do atendimento** na
querystring. É esse parâmetro que define qual link de agendamento aparece na
tela de agradecimento:

```
https://SEU-DOMINIO/?tipo=primeira       # primeira consulta
https://SEU-DOMINIO/?tipo=reavaliacao    # retorno / reavaliação
```

Com o parâmetro presente, a pesquisa **não pergunta** o tipo — o cliente só
escolhe o profissional. Sem o parâmetro (link antigo, link colado à mão), a
Etapa 1 exibe dois botões para o próprio cliente informar, de modo que o fluxo
nunca quebra.

A especialidade não vai no link: ela vem do profissional que o cliente
seleciona na Etapa 1 (`role` em `nps_professionals`).

### Jornada

| Avaliação enviada      | Link oferecido em `/obrigado` |
| ---------------------- | ----------------------------- |
| Nutri · primeira       | Personal `?tipo=primeira`     |
| Nutri · reavaliação    | Personal `?tipo=reavaliacao`  |
| Personal · primeira    | **nenhum**                    |
| Personal · reavaliação | **nenhum**                    |

**Só oferecemos agendamento depois do NPS do nutricionista.** Depois do
Personal o próximo passo da jornada seria o retorno com a Nutri, a ~30 dias —
distante demais para uma agenda que ainda não está organizada nesse horizonte.
Esses retornos são combinados fora da pesquisa. Nesse caso, e também quando não
dá para identificar o ponto da jornada, a tela mostra só o agradecimento.

Os links e a regra ficam em [`src/lib/scheduling.js`](src/lib/scheduling.js) — é
o único arquivo a mexer se as URLs mudarem ou se a agenda de retorno abrir esse
horizonte (os links da Nutri já estão lá, sem uso hoje).

### Tipo do atendimento no banco

Além de montar o link, o tipo é gravado em `nps_responses.tipo_consulta`
(`primeira` | `reavaliacao` | `NULL`). `NULL` são as respostas anteriores à
coluna ou envios sem o parâmetro — aparecem no painel como **"Não informado"**.

O painel usa esse campo em três lugares: um cartão **"1ª consulta x Retorno"** na
Visão geral, o mesmo cartão no detalhe de cada profissional (para ver se ele
recebe mais avaliação de primeira consulta ou de retorno, e o NPS de cada
fatia), e um filtro + etiqueta na aba **Respostas**.

## Estrutura

```
supabase/
  migrations/0001_nps_init.sql   # Tabelas + RLS (rodar no SQL Editor)
  functions/nps-admin/index.ts   # Edge Function: login + ações protegidas
  config.toml                    # verify_jwt = false para a função
src/
  components/
    ProfessionalSelector.jsx     # Etapa 1
    ConsultationTypeSelector.jsx # Etapa 1 (só sem `?tipo=` na URL)
    NextStepCard.jsx             # CTA do próximo agendamento (/obrigado)
    NPSScale.jsx                 # Etapa 2
    ExtraQuestions.jsx           # Etapa 3 (usa StarRating)
    StarRating.jsx / CommentBox.jsx / ProgressBar.jsx / Avatar.jsx
    admin/
      LoginGate.jsx              # Tela de senha
      AdminDashboard.jsx         # Painel autenticado (3 abas)
    dashboard/
      StatTile / NpsDistributionBar / ProfessionalRanking
      ConsultationTypeBreakdown      # 1ª consulta x retorno
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
    scheduling.js                # Links de agendamento + regra da jornada
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
  tipo_consulta: "primeira",  // "primeira" | "reavaliacao" | null
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

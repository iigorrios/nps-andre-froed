/**
 * Funções de agregação de NPS. Puras (sem React), fáceis de testar e reutilizar.
 *
 * Regras clássicas de NPS:
 *  - Promotor:  nota 9 ou 10
 *  - Neutro:    nota 7 ou 8
 *  - Detrator:  nota 0 a 6
 *  - NPS = %Promotores − %Detratores  (varia de −100 a +100)
 */

export const STAR_CRITERIA = [
  { key: "pontualidade", label: "Pontualidade" },
  { key: "clareza", label: "Clareza" },
  { key: "simpatia", label: "Simpatia" },
  { key: "conhecimento_tecnico", label: "Conhecimento técnico" },
];

/**
 * Tipos de atendimento, na ordem fixa de exibição.
 * `indefinido` cobre as respostas anteriores à coluna `tipo_consulta` e os
 * envios cujo link não trazia `?tipo=` — nunca é "mais um tipo", é ausência
 * de dado, por isso vem sempre por último e em cinza.
 */
export const CONSULTATION_TYPES = [
  { key: "primeira", label: "1ª consulta" },
  { key: "reavaliacao", label: "Retorno" },
  { key: "indefinido", label: "Não informado" },
];

/** Lê o tipo de uma resposta, normalizando ausência/valor inesperado. */
export function consultationTypeOf(response) {
  const t = response?.tipo_consulta;
  return t === "primeira" || t === "reavaliacao" ? t : "indefinido";
}

/** Classifica uma nota NPS em promotor/neutro/detrator. */
export function classifyNps(score) {
  if (score >= 9) return "promotor";
  if (score >= 7) return "neutro";
  return "detrator";
}

/** Média simples (0 se lista vazia). */
function avg(nums) {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

/**
 * Calcula todas as métricas de um conjunto de respostas.
 * Reutilizável tanto para o total geral quanto por profissional.
 */
export function computeMetrics(responses) {
  const total = responses.length;

  const counts = { promotor: 0, neutro: 0, detrator: 0 };
  for (const r of responses) counts[classifyNps(r.nps_score)]++;

  const nps =
    total === 0
      ? 0
      : Math.round(((counts.promotor - counts.detrator) / total) * 100);

  // Médias por critério de estrela.
  const stars = {};
  for (const { key } of STAR_CRITERIA) {
    stars[key] = avg(responses.map((r) => r[key]).filter((v) => v > 0));
  }

  // Média geral das estrelas (todos os critérios juntos).
  const starAvg = avg(STAR_CRITERIA.map(({ key }) => stars[key]).filter((v) => v > 0));

  return {
    total,
    nps,
    counts,
    // Percentuais (0..100)
    percents: {
      promotor: total ? (counts.promotor / total) * 100 : 0,
      neutro: total ? (counts.neutro / total) * 100 : 0,
      detrator: total ? (counts.detrator / total) * 100 : 0,
    },
    stars,
    starAvg,
  };
}

/**
 * Monta o ranking de profissionais por NPS.
 * @param professionals lista [{ id, name, role, photo }]
 * @param responses lista de respostas
 * @returns lista ordenada (NPS desc) com métricas embutidas
 */
export function buildRanking(professionals, responses) {
  const byPro = groupByProfessional(responses);

  return professionals
    .map((pro) => ({
      professional: pro,
      metrics: computeMetrics(byPro.get(pro.id) ?? []),
    }))
    .sort((a, b) => {
      // Desempata por total de respostas quando o NPS é igual.
      if (b.metrics.nps !== a.metrics.nps) return b.metrics.nps - a.metrics.nps;
      return b.metrics.total - a.metrics.total;
    });
}

/**
 * Divide as respostas por tipo de atendimento e calcula as métricas de cada
 * fatia — responde "este profissional recebe mais avaliação de primeira
 * consulta ou de retorno, e como é o NPS em cada caso?".
 *
 * Devolve sempre os três tipos, na ordem de CONSULTATION_TYPES (inclusive os
 * zerados: a ausência é informação).
 *
 * @param responses lista de respostas (já filtrada por profissional, se for o caso)
 */
export function splitByConsultationType(responses) {
  const groups = { primeira: [], reavaliacao: [], indefinido: [] };
  for (const r of responses) groups[consultationTypeOf(r)].push(r);

  const total = responses.length;

  return CONSULTATION_TYPES.map(({ key, label }) => ({
    key,
    label,
    total: groups[key].length,
    percent: total ? (groups[key].length / total) * 100 : 0,
    metrics: computeMetrics(groups[key]),
  }));
}

/** Agrupa respostas por professional_id (Map). */
export function groupByProfessional(responses) {
  const map = new Map();
  for (const r of responses) {
    if (!map.has(r.professional_id)) map.set(r.professional_id, []);
    map.get(r.professional_id).push(r);
  }
  return map;
}

/**
 * Faixa de "saúde" do NPS — usada para colorir com semântica de status.
 * (verde = bom, âmbar = atenção, vermelho = crítico)
 */
export function npsBand(nps) {
  if (nps >= 50) return { key: "bom", label: "Excelente", tone: "emerald" };
  if (nps >= 0) return { key: "atencao", label: "Razoável", tone: "amber" };
  return { key: "critico", label: "Crítico", tone: "red" };
}

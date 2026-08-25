/**
 * Jornada de agendamentos da Consultoria André Froed.
 *
 * Sequência oficial do acompanhamento:
 *
 *   1ª consulta Nutri  →  NPS Nutri  →  1ª consulta Personal
 *   1ª consulta Personal →  NPS Personal →  (30 dias) → retorno Nutri
 *   retorno Nutri      →  NPS Nutri  →  retorno Personal
 *   retorno Personal   →  NPS Personal →  (30 dias) → retorno Nutri  (ciclo)
 *
 * Este módulo concentra os links e a regra "qual é o próximo agendamento",
 * para que a tela de agradecimento (e qualquer outra) apenas consuma o
 * resultado pronto.
 */

const BASE = "https://agendamento.andrefroed.com.br";

/** Links oficiais de agendamento. */
export const SCHEDULING_LINKS = {
  /** Agenda geral — usada como fallback quando não sabemos o próximo passo. */
  geral: `${BASE}/agenda`,
  nutricionista: {
    primeira: `${BASE}/agendar/nutricao?tipo=primeira`,
    reavaliacao: `${BASE}/agendar/nutricao?tipo=reavaliacao`,
  },
  personal: {
    primeira: `${BASE}/agendar/personal?tipo=primeira`,
    reavaliacao: `${BASE}/agendar/personal?tipo=reavaliacao`,
  },
};

/** Tipos de consulta aceitos pelo fluxo. */
export const CONSULTATION_TYPES = ["primeira", "reavaliacao"];

/** Rótulos amigáveis do tipo de consulta (usados na UI). */
export const CONSULTATION_TYPE_LABELS = {
  primeira: "Primeira consulta",
  reavaliacao: "Retorno / reavaliação",
};

/** Artigo + rótulo de cada especialidade, para montar frases naturais. */
const ROLE_PHRASE = {
  nutricionista: { artigo: "a", label: "Nutricionista" },
  personal: { artigo: "o", label: "Personal Trainer" },
};

/**
 * Normaliza o tipo de consulta vindo da URL.
 * Aceita sinônimos usados no dia a dia ("retorno", "reavaliação").
 * @returns {"primeira" | "reavaliacao" | null}
 */
export function normalizeConsultationType(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  if (v === "primeira" || v === "primeira-consulta") return "primeira";
  if (["reavaliacao", "reavaliação", "retorno"].includes(v)) return "reavaliacao";
  return null;
}

/**
 * Normaliza a especialidade vinda da URL.
 * Aceita os apelidos usados nos links de agendamento ("nutricao", "nutri").
 * @returns {"nutricionista" | "personal" | null}
 */
export function normalizeRole(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  if (["nutricionista", "nutricao", "nutrição", "nutri"].includes(v)) {
    return "nutricionista";
  }
  if (["personal", "personal trainer", "treino"].includes(v)) return "personal";
  return null;
}

/**
 * Mapa da jornada: atendimento recém-avaliado → próximo agendamento.
 * Chave: `${role}:${tipo}` do atendimento que acabou de ser avaliado.
 */
const JOURNEY = {
  "nutricionista:primeira": {
    role: "personal",
    tipo: "primeira",
    delayDays: 0,
    description:
      "Com o plano alimentar em mãos, o próximo passo é montar o seu treino com o Personal Trainer.",
  },
  "personal:primeira": {
    role: "nutricionista",
    tipo: "reavaliacao",
    delayDays: 30,
    description:
      "Seu primeiro ciclo está completo! Em cerca de 30 dias acontece o retorno com a Nutricionista — já deixe agendado para garantir o melhor horário.",
  },
  "nutricionista:reavaliacao": {
    role: "personal",
    tipo: "reavaliacao",
    delayDays: 0,
    description:
      "Agora é hora de ajustar o treino junto com a nova fase do plano alimentar.",
  },
  "personal:reavaliacao": {
    role: "nutricionista",
    tipo: "reavaliacao",
    delayDays: 30,
    description:
      "Mais um ciclo concluído! Em cerca de 30 dias acontece o próximo retorno com a Nutricionista — já deixe agendado.",
  },
};

/**
 * Descobre o próximo agendamento a partir do atendimento avaliado.
 *
 * @param {string|null} role  especialidade avaliada ("nutricionista" | "personal")
 * @param {string|null} tipo  tipo do atendimento avaliado ("primeira" | "reavaliacao")
 * @returns {{
 *   role: "nutricionista" | "personal",
 *   tipo: "primeira" | "reavaliacao",
 *   delayDays: number,
 *   url: string,
 *   title: string,
 *   description: string,
 *   cta: string
 * } | null}  `null` quando não dá para determinar (ex.: link aberto direto).
 */
export function getNextStep(role, tipo) {
  const from = normalizeRole(role);
  const kind = normalizeConsultationType(tipo);
  if (!from || !kind) return null;

  const next = JOURNEY[`${from}:${kind}`];
  if (!next) return null;

  const { artigo, label } = ROLE_PHRASE[next.role];
  const isRetorno = next.tipo === "reavaliacao";

  return {
    role: next.role,
    tipo: next.tipo,
    delayDays: next.delayDays,
    url: SCHEDULING_LINKS[next.role][next.tipo],
    title: isRetorno
      ? `Retorno com ${artigo} ${label}`
      : `Primeira consulta com ${artigo} ${label}`,
    description: next.description,
    cta: isRetorno ? `Agendar retorno com ${artigo} ${label}` : `Agendar com ${artigo} ${label}`,
  };
}

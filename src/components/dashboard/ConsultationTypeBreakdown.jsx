import { npsBand } from "../../lib/nps.js";

/**
 * Primeira consulta x Retorno — composição das respostas e NPS de cada fatia.
 *
 * Forma: barra empilhada (parte-do-todo em uma única dimensão) + tabela curta
 * com contagem, percentual e NPS. A barra responde "de onde vem o volume"; a
 * tabela responde "a nota muda entre os dois momentos?".
 *
 * Cores: paleta categórica (identidade, não magnitude) — azul e violeta,
 * validadas para daltonismo (ΔE deutan 10,9). Deliberadamente FORA do
 * vermelho/âmbar/verde, que neste painel são status de NPS. `indefinido` é
 * cinza porque é ausência de dado, não uma terceira categoria.
 * O contraste do azul sobre o branco fica abaixo de 3:1, então cada fatia
 * SEMPRE traz rótulo textual — identidade nunca depende só da cor.
 *
 * Props:
 *  - split: retorno de splitByConsultationType()
 *  - total: total de respostas (para o estado vazio)
 */
const STYLES = {
  primeira: { fill: "bg-sky-500", dot: "bg-sky-500", text: "text-sky-700" },
  reavaliacao: {
    fill: "bg-violet-500",
    dot: "bg-violet-500",
    text: "text-violet-700",
  },
  indefinido: {
    fill: "bg-slate-300",
    dot: "bg-slate-300",
    text: "text-slate-500",
  },
};

/**
 * Cor do NPS por faixa. Mapa estático porque o Tailwind não gera classes
 * montadas em tempo de execução (`text-${tone}-600` não existiria no CSS).
 */
const NPS_TONE = {
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  red: "text-red-600",
};

export default function ConsultationTypeBreakdown({ split, total }) {
  if (!total) {
    return (
      <p className="text-sm text-slate-400">
        Nenhuma resposta para separar por tipo de atendimento ainda.
      </p>
    );
  }

  // "Não informado" só polui quando não existe — some se estiver zerado.
  const rows = split.filter((s) => s.total > 0 || s.key !== "indefinido");

  return (
    <div>
      {/* Barra empilhada — 2px de superfície entre os segmentos */}
      <div
        className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={split
          .map((s) => `${s.label}: ${s.total} (${Math.round(s.percent)}%)`)
          .join(", ")}
      >
        {rows.map((s) =>
          s.percent > 0 ? (
            <div
              key={s.key}
              className={`${STYLES[s.key].fill} h-full first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${s.percent}%` }}
              title={`${s.label}: ${s.total} (${Math.round(s.percent)}%)`}
            />
          ) : null
        )}
      </div>

      {/* Detalhe textual: volume + NPS de cada fatia */}
      <ul className="mt-4 space-y-2.5">
        {rows.map((s) => {
          const band = npsBand(s.metrics.nps);
          return (
            <li key={s.key} className="flex items-center gap-3 text-sm">
              <span
                className={`h-2.5 w-2.5 flex-none rounded-full ${STYLES[s.key].dot}`}
                aria-hidden="true"
              />
              <span className="flex-1 text-slate-600">{s.label}</span>

              <span className={`font-bold tabular-nums ${STYLES[s.key].text}`}>
                {s.total}
                <span className="ml-1 text-xs font-normal text-slate-400">
                  ({Math.round(s.percent)}%)
                </span>
              </span>

              {/* NPS da fatia — só faz sentido com respostas */}
              <span
                className="w-24 text-right text-xs text-slate-400"
                title={`NPS de ${s.label.toLowerCase()}`}
              >
                {s.total > 0 ? (
                  <>
                    NPS{" "}
                    <span
                      className={`font-bold tabular-nums ${
                        NPS_TONE[band.tone] ?? "text-slate-600"
                      }`}
                    >
                      {s.metrics.nps > 0 ? "+" : ""}
                      {s.metrics.nps}
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import StarRating from "./StarRating.jsx";

/**
 * Etapa 3 — Perguntas complementares (avaliação por estrelas, 1 a 5).
 *
 * As chaves de `ratings` batem com as colunas da futura tabela `nps_responses`
 * do Supabase (pontualidade, clareza, simpatia, conhecimento_tecnico).
 *
 * Props:
 *  - ratings: objeto { pontualidade, clareza, simpatia, conhecimento_tecnico }
 *  - onChange: (key, value) => void
 */
const QUESTIONS = [
  { key: "pontualidade", label: "Pontualidade no horário agendado" },
  { key: "clareza", label: "Clareza nas orientações e explicações passadas" },
  { key: "simpatia", label: "Simpatia e atenção durante o atendimento" },
  { key: "conhecimento_tecnico", label: "Conhecimento técnico demonstrado" },
];

export default function ExtraQuestions({ ratings, onChange }) {
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-xl font-bold text-slate-800">
        Como foi o atendimento em alguns pontos?
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Toque nas estrelas para avaliar cada item.
      </p>

      <div className="mt-5 space-y-3">
        {QUESTIONS.map((q) => (
          <StarRating
            key={q.key}
            name={q.key}
            label={q.label}
            value={ratings[q.key]}
            onChange={(value) => onChange(q.key, value)}
          />
        ))}
      </div>
    </div>
  );
}

// Exporta as chaves para quem quiser validar/iterar externamente.
export const EXTRA_QUESTION_KEYS = QUESTIONS.map((q) => q.key);

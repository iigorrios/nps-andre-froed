/**
 * Etapa 2 — Pergunta NPS clássica (0 a 10).
 *
 * A escala é apenas VISUAL: as faixas recebem cores diferentes, mas os rótulos
 * "detrator / neutro / promotor" NÃO são expostos ao cliente.
 *
 * Faixas:
 *  0–6  → vermelho/âmbar (crítico)
 *  7–8  → amarelo (neutro)
 *  9–10 → verde (promotor)
 *
 * Props:
 *  - professionalName: nome do profissional avaliado (interpolado na pergunta)
 *  - value: nota selecionada (0–10) ou null
 *  - onChange: (score) => void
 */
export default function NPSScale({ professionalName, value, onChange }) {
  const scores = Array.from({ length: 11 }, (_, i) => i); // 0..10

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-xl font-bold text-slate-800">
        De 0 a 10, o quanto você indicaria o atendimento de{" "}
        <span className="text-brand-600">{professionalName}</span> para um amigo
        ou familiar?
      </h2>

      <div
        className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-11"
        role="radiogroup"
        aria-label="Nota de 0 a 10"
      >
        {scores.map((score) => {
          const isSelected = value === score;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Nota ${score}`}
              onClick={() => onChange(score)}
              className={`aspect-square rounded-xl border-2 text-lg font-bold transition-all duration-150 ${scoreClasses(
                score,
                isSelected
              )}`}
            >
              {score}
            </button>
          );
        })}
      </div>

      {/* Legenda das extremidades (ajuda o cliente, sem jargão de NPS) */}
      <div className="mt-3 flex justify-between text-xs font-medium text-slate-400">
        <span>Não indicaria</span>
        <span>Indicaria com certeza</span>
      </div>
    </div>
  );
}

/** Classes de cor por faixa; realça a nota selecionada. */
function scoreClasses(score, isSelected) {
  // Faixa de cor (apenas visual)
  let tone;
  if (score <= 6) tone = "red";
  else if (score <= 8) tone = "amber";
  else tone = "emerald";

  const palettes = {
    red: {
      selected: "border-red-500 bg-red-500 text-white shadow-md scale-105",
      idle: "border-red-200 bg-red-50 text-red-600 hover:border-red-400",
    },
    amber: {
      selected: "border-amber-500 bg-amber-500 text-white shadow-md scale-105",
      idle: "border-amber-200 bg-amber-50 text-amber-600 hover:border-amber-400",
    },
    emerald: {
      selected:
        "border-emerald-500 bg-emerald-500 text-white shadow-md scale-105",
      idle: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400",
    },
  };

  return isSelected ? palettes[tone].selected : palettes[tone].idle;
}

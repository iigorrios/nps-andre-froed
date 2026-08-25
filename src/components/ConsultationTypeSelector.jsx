import { CONSULTATION_TYPES, CONSULTATION_TYPE_LABELS } from "../lib/scheduling.js";

/**
 * Etapa 1 (complemento) — tipo do atendimento avaliado.
 *
 * Só é exibido quando o link da pesquisa não trouxe `?tipo=` na URL. Serve
 * para descobrir qual é o próximo agendamento da jornada (ver
 * `src/lib/scheduling.js`), já que "primeira consulta" e "retorno" levam a
 * links de agendamento diferentes.
 *
 * Props:
 *  - value: "primeira" | "reavaliacao" | null
 *  - onChange: (tipo) => void
 */
export default function ConsultationTypeSelector({ value, onChange }) {
  return (
    <div className="mt-7 border-t border-slate-100 pt-6">
      <h3 className="text-base font-bold text-slate-800">
        Este atendimento foi…
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Assim conseguimos indicar o próximo agendamento certo para você.
      </p>

      <div
        className="mt-4 grid grid-cols-2 gap-3"
        role="radiogroup"
        aria-label="Tipo do atendimento"
      >
        {CONSULTATION_TYPES.map((tipo) => {
          const isSelected = tipo === value;
          return (
            <button
              key={tipo}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(tipo)}
              className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                isSelected
                  ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50/40"
              }`}
            >
              {CONSULTATION_TYPE_LABELS[tipo]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { ROLE_LABELS } from "../data/professionals.mock.js";
import Avatar from "./Avatar.jsx";

/**
 * Etapa 1 — Seleção do profissional que realizou o atendimento.
 *
 * Props:
 *  - professionals: lista de profissionais [{ id, name, role }]
 *  - selectedId: id atualmente selecionado (ou null)
 *  - onSelect: (id) => void  — chamado ao clicar em um cartão
 */
export default function ProfessionalSelector({
  professionals,
  selectedId,
  onSelect,
}) {
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-xl font-bold text-slate-800">
        Quem realizou o seu atendimento?
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Selecione o profissional para começar.
      </p>

      <ul className="mt-5 space-y-3" role="radiogroup" aria-label="Profissionais">
        {professionals.map((pro) => {
          const isSelected = pro.id === selectedId;
          return (
            <li key={pro.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(pro.id)}
                className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-brand-500 bg-brand-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
                }`}
              >
                {/* Avatar (foto ou iniciais) */}
                <Avatar name={pro.name} photo={pro.photo} selected={isSelected} />

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-800">
                    {pro.name}
                  </span>
                  <span className="block text-sm text-slate-500">
                    {ROLE_LABELS[pro.role] ?? pro.role}
                  </span>
                </span>

                {/* Marcador de seleção */}
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-slate-300"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.3 6.8-6.8a1 1 0 0 1 1.4 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

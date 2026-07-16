/**
 * Avaliação por estrelas (1 a 5). Componente reutilizável.
 *
 * Props:
 *  - label: texto da pergunta
 *  - value: nota atual (1–5) ou 0/undefined quando não avaliado
 *  - onChange: (value) => void
 *  - name: identificador único (para acessibilidade do grupo)
 */
export default function StarRating({ label, value = 0, onChange, name }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p id={`${name}-label`} className="font-semibold text-slate-700">
        {label}
      </p>

      <div
        className="mt-3 flex items-center gap-1.5"
        role="radiogroup"
        aria-labelledby={`${name}-label`}
      >
        {stars.map((star) => {
          const isFilled = star <= value;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} de 5 estrelas`}
              onClick={() => onChange(star)}
              className="rounded-md p-1 transition-transform duration-100 hover:scale-110"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-8 w-8 transition-colors ${
                  isFilled ? "text-amber-400" : "text-slate-200"
                }`}
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.3l6.5-.9L12 2.5z" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

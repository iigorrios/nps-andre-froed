import { SCHEDULING_LINKS } from "../lib/scheduling.js";

/** Formata uma data futura em "DD/MM" (pt-BR). */
function formatFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/**
 * Cartão de "próximo passo" exibido na tela de agradecimento.
 *
 * Recebe o resultado de `getNextStep()`. Quando `step` é `null` (não deu para
 * identificar o ponto da jornada), cai no link da agenda geral.
 *
 * Props:
 *  - step: retorno de `getNextStep()` ou null
 */
export default function NextStepCard({ step }) {
  // Fallback: não sabemos onde a pessoa está na jornada → agenda geral.
  if (!step) {
    return (
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-5 text-left shadow-sm">
        <p className="text-sm text-slate-600">
          Quer já deixar sua próxima consulta marcada?
        </p>
        <a
          href={SCHEDULING_LINKS.geral}
          className="mt-4 flex w-full items-center justify-center rounded-2xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          Ver agenda e marcar consulta
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-3xl border-2 border-brand-200 bg-white/80 p-5 text-left shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
        Próximo passo da sua jornada
      </p>

      <h2 className="mt-1.5 text-lg font-bold text-slate-800">{step.title}</h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {step.description}
      </p>

      {step.delayDays > 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600">
          📅 A partir de {formatFutureDate(step.delayDays)}
        </p>
      )}

      <a
        href={step.url}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        {step.cta}
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4-1.4L11.6 10 7.3 5.7a1 1 0 0 1 0-1.4Z"
            clipRule="evenodd"
          />
        </svg>
      </a>

      <a
        href={SCHEDULING_LINKS.geral}
        className="mt-3 block text-center text-sm font-medium text-slate-500 underline-offset-2 transition-colors hover:text-brand-700 hover:underline"
      >
        Ver a agenda completa
      </a>
    </div>
  );
}

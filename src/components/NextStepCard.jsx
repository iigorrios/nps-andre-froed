/**
 * Cartão de "próximo passo" exibido na tela de agradecimento.
 *
 * Recebe o resultado de `getNextStep()`. Quando é `null` NÃO renderiza nada —
 * a pessoa vê só o agradecimento. Isso cobre dois casos de propósito:
 *  - o atendimento avaliado foi com o Personal (o próximo passo seria o retorno
 *    com a Nutri, a ~30 dias — longe demais para a agenda de hoje);
 *  - não dá para saber o ponto da jornada (`/obrigado` aberto direto).
 *
 * Props:
 *  - step: retorno de `getNextStep()` ou null
 */
export default function NextStepCard({ step }) {
  if (!step) return null;

  return (
    <div className="mt-8 rounded-3xl border-2 border-brand-200 bg-white/80 p-5 text-left shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
        Próximo passo da sua jornada
      </p>

      <h2 className="mt-1.5 text-lg font-bold text-slate-800">{step.title}</h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {step.description}
      </p>

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
    </div>
  );
}

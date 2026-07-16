/**
 * Etapa 5 — Tela de agradecimento (/obrigado).
 *
 * Mensagem calorosa, alinhada à identidade da consultoria (transformação,
 * saúde, disciplina). Propositalmente SEM botão de voltar para a pesquisa,
 * para evitar reenvio acidental de respostas.
 */
export default function ThankYouPage() {
  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-in-up text-center">
        {/* Ícone de confirmação */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-600 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold text-slate-800">
          Obrigado pela sua avaliação! 💚
        </h1>

        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Sua opinião nos ajuda a evoluir e a cuidar de cada detalhe da sua
          jornada de transformação. Continue firme, com disciplina e saúde — o
          time da <span className="font-semibold text-brand-700">Consultoria
          André Froed</span> está com você em cada passo.
        </p>

        <p className="mt-6 text-sm font-medium text-slate-400">
          Você já pode fechar esta página.
        </p>
      </div>
    </main>
  );
}

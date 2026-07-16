/**
 * Indicador de progresso do wizard.
 *
 * Mostra "Etapa X de N" + uma barra preenchida proporcionalmente.
 *
 * Props:
 *  - current: número da etapa atual (1-based)
 *  - total: total de etapas
 */
export default function ProgressBar({ current, total }) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-500">
        <span>
          Etapa {current} de {total}
        </span>
        <span aria-hidden="true">{percent}%</span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`Etapa ${current} de ${total}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Barra segmentada com a distribuição Detratores / Neutros / Promotores.
 *
 * Cores (validadas): detrator = vermelho, neutro = âmbar, promotor = verde.
 * Como o contraste dessas cores sobre a superfície é baixo, os segmentos
 * SEMPRE trazem rótulo textual + percentual (identidade nunca é só cor).
 *
 * Props:
 *  - percents: { detrator, neutro, promotor } em 0..100
 *  - counts:   { detrator, neutro, promotor } (contagens absolutas)
 */
const SEGMENTS = [
  { key: "detrator", label: "Detratores", fill: "bg-red-500", text: "text-red-600" },
  { key: "neutro", label: "Neutros", fill: "bg-amber-500", text: "text-amber-600" },
  { key: "promotor", label: "Promotores", fill: "bg-emerald-500", text: "text-emerald-600" },
];

export default function NpsDistributionBar({ percents, counts }) {
  const hasData = SEGMENTS.some((s) => percents[s.key] > 0);

  return (
    <div>
      {/* Barra empilhada — 2px de gap (superfície) entre os segmentos */}
      <div
        className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label="Distribuição de detratores, neutros e promotores"
      >
        {hasData &&
          SEGMENTS.map((s) =>
            percents[s.key] > 0 ? (
              <div
                key={s.key}
                className={`${s.fill} h-full first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${percents[s.key]}%` }}
                title={`${s.label}: ${Math.round(percents[s.key])}%`}
              />
            ) : null
          )}
      </div>

      {/* Legenda com rótulo + contagem + percentual (sempre textual) */}
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {SEGMENTS.map((s) => (
          <li key={s.key} className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${s.fill}`} aria-hidden="true" />
              {s.label}
            </span>
            <span className={`mt-0.5 text-sm font-bold tabular-nums ${s.text}`}>
              {Math.round(percents[s.key])}%
              <span className="ml-1 font-normal text-slate-400">
                ({counts[s.key]})
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

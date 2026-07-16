/**
 * "Stat tile" — número em destaque com rótulo. Sem gráfico.
 * (Forma recomendada quando o dado é um único headline.)
 *
 * Props:
 *  - label: rótulo curto
 *  - value: valor principal (string/number)
 *  - hint: texto auxiliar opcional (ex.: faixa, unidade)
 *  - tone: "emerald" | "amber" | "red" | "brand" (cor do valor)
 *  - icon: nó opcional exibido à esquerda
 */
const VALUE_TONE = {
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  red: "text-red-600",
  brand: "text-brand-600",
  slate: "text-slate-800",
};

export default function StatTile({ label, value, hint, tone = "slate", icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`mt-2 text-3xl font-extrabold tabular-nums ${
          VALUE_TONE[tone] ?? VALUE_TONE.slate
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

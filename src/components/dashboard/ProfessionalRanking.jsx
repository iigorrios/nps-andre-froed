import Avatar from "../Avatar.jsx";
import { ROLE_LABELS } from "../../data/professionals.mock.js";
import { npsBand } from "../../lib/nps.js";

/**
 * Ranking de profissionais por NPS.
 *
 * O NPS varia de −100 a +100, então usamos uma BARRA DIVERGENTE com linha de
 * base no centro (0): valores positivos crescem para a direita (verde),
 * negativos para a esquerda (vermelho). A cor segue a faixa de "saúde" do NPS
 * (status), e o número aparece sempre como rótulo — nunca só a cor.
 *
 * Props:
 *  - ranking: [{ professional, metrics }] já ordenado (ver buildRanking)
 *  - onSelect: (professionalId) => void  — clique abre o detalhe
 *  - selectedId: id destacado
 */
const BAR_TONE = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};
const BADGE_TONE = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
};

export default function ProfessionalRanking({ ranking, onSelect, selectedId }) {
  return (
    <ol className="space-y-2">
      {ranking.map((row, index) => {
        const { professional: pro, metrics } = row;
        const band = npsBand(metrics.nps);
        const isSelected = pro.id === selectedId;
        // Meia-largura da barra: |nps|/100 * 50% (metade do trilho).
        const halfWidth = (Math.abs(metrics.nps) / 100) * 50;
        const isPositive = metrics.nps >= 0;

        return (
          <li key={pro.id}>
            <button
              type="button"
              onClick={() => onSelect(pro.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                isSelected
                  ? "border-brand-400 bg-brand-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              {/* Posição no ranking */}
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-bold ${
                  index === 0
                    ? "bg-amber-400 text-white"
                    : index === 1
                    ? "bg-slate-300 text-white"
                    : index === 2
                    ? "bg-amber-700/80 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {index + 1}
              </span>

              <Avatar name={pro.name} photo={pro.photo} size="sm" />

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">{pro.name}</p>
                <p className="text-xs text-slate-500">
                  {ROLE_LABELS[pro.role] ?? pro.role} · {metrics.total}{" "}
                  {metrics.total === 1 ? "resposta" : "respostas"}
                </p>

                {/* Barra divergente (centro = 0) */}
                <div className="relative mt-2 h-2 w-full rounded-full bg-slate-100">
                  {/* Linha de base no centro */}
                  <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300" />
                  <span
                    className={`absolute inset-y-0 rounded-full ${BAR_TONE[band.tone]}`}
                    style={
                      isPositive
                        ? { left: "50%", width: `${halfWidth}%` }
                        : { right: "50%", width: `${halfWidth}%` }
                    }
                  />
                </div>
              </div>

              {/* NPS numérico + faixa (rótulo textual sempre presente) */}
              <div className="flex flex-none flex-col items-end">
                <span
                  className={`rounded-lg px-2 py-0.5 text-lg font-extrabold tabular-nums ${
                    BADGE_TONE[band.tone]
                  }`}
                >
                  {metrics.nps > 0 ? "+" : ""}
                  {metrics.nps}
                </span>
                <span className="mt-0.5 text-[11px] font-medium text-slate-400">
                  {band.label}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

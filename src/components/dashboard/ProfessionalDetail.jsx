import Avatar from "../Avatar.jsx";
import StatTile from "./StatTile.jsx";
import NpsDistributionBar from "./NpsDistributionBar.jsx";
import { ROLE_LABELS } from "../../data/professionals.mock.js";
import { STAR_CRITERIA, npsBand } from "../../lib/nps.js";

/**
 * Detalhe de um profissional: cabeçalho, KPIs, distribuição NPS,
 * médias por critério (barras) e comentários recentes.
 *
 * Props:
 *  - professional: { id, name, role, photo }
 *  - metrics: retorno de computeMetrics()
 *  - responses: respostas SÓ desse profissional (para listar comentários)
 */
export default function ProfessionalDetail({ professional, metrics, responses }) {
  const band = npsBand(metrics.nps);

  // Comentários não vazios, mais recentes primeiro.
  const comments = responses
    .filter((r) => r.comentario && r.comentario.trim().length > 0)
    .slice(0, 6);

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Avatar name={professional.name} photo={professional.photo} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate text-xl font-bold text-slate-800">
            {professional.name}
          </h3>
          <p className="text-sm text-slate-500">
            {ROLE_LABELS[professional.role] ?? professional.role}
          </p>
        </div>
      </div>

      {metrics.total === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Ainda não há respostas para este profissional.
        </p>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              label="NPS"
              value={`${metrics.nps > 0 ? "+" : ""}${metrics.nps}`}
              hint={band.label}
              tone={band.tone}
            />
            <StatTile label="Respostas" value={metrics.total} tone="brand" />
            <StatTile
              label="Média ★"
              value={metrics.starAvg.toFixed(1)}
              hint="de 5,0"
              tone="amber"
            />
          </div>

          {/* Distribuição */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-600">
              Distribuição das notas
            </h4>
            <NpsDistributionBar
              percents={metrics.percents}
              counts={metrics.counts}
            />
          </div>

          {/* Médias por critério (barras horizontais, hue única) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-600">
              Médias por critério (1 a 5)
            </h4>
            <ul className="space-y-3">
              {STAR_CRITERIA.map(({ key, label }) => {
                const val = metrics.stars[key] ?? 0;
                return (
                  <li key={key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold tabular-nums text-slate-800">
                        {val.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${(val / 5) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Comentários recentes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-600">
              Comentários recentes
            </h4>
            {comments.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nenhum comentário deixado ainda.
              </p>
            ) : (
              <ul className="space-y-2">
                {comments.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600"
                  >
                    <span className="mr-1 text-slate-300">“</span>
                    {c.comentario}
                    <span className="ml-1 text-slate-300">”</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

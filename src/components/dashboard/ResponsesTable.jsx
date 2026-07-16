import { useMemo, useState } from "react";
import { ROLE_LABELS } from "../../data/professionals.mock.js";
import { classifyNps, STAR_CRITERIA } from "../../lib/nps.js";

/**
 * Lista de respostas com opção de EXCLUIR (para apagar respostas dadas por
 * engano). Permite filtrar por profissional.
 *
 * Props:
 *  - responses: lista (cada item pode ter `professional` embutido)
 *  - professionals: lista de profissionais (para o filtro e nomes)
 *  - onDelete: async (id) => void  — remove no backend e recarrega
 */
const NPS_BADGE = {
  promotor: "bg-emerald-50 text-emerald-700",
  neutro: "bg-amber-50 text-amber-700",
  detrator: "bg-red-50 text-red-700",
};

export default function ResponsesTable({ responses, professionals, onDelete }) {
  const [filterId, setFilterId] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  // Nome do profissional por id (fallback quando não vem embutido).
  const nameById = useMemo(() => {
    const m = new Map();
    for (const p of professionals) m.set(p.id, p);
    return m;
  }, [professionals]);

  const filtered = useMemo(() => {
    if (filterId === "all") return responses;
    return responses.filter((r) => String(r.professional_id) === filterId);
  }, [responses, filterId]);

  const handleDelete = async (r) => {
    if (
      !window.confirm(
        "Excluir esta resposta? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }
    setError("");
    setDeletingId(r.id);
    try {
      await onDelete(r.id);
    } catch (e) {
      setError(e?.message || "Não foi possível excluir.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Filtro por profissional */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="filtro-pro" className="text-sm font-medium text-slate-600">
          Profissional:
        </label>
        <select
          id="filtro-pro"
          value={filterId}
          onChange={(e) => setFilterId(e.target.value)}
          className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-400"
        >
          <option value="all">Todos</option>
          {professionals.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-400">
          {filtered.length} {filtered.length === 1 ? "resposta" : "respostas"}
        </span>
      </div>

      {error && (
        <p className="mb-3 text-sm font-medium text-red-500">{error}</p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Nenhuma resposta para exibir.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => {
            const pro = r.professional ?? nameById.get(r.professional_id);
            const category = classifyNps(r.nps_score);
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">
                      {pro?.name ?? "Profissional removido"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {pro ? ROLE_LABELS[pro.role] ?? pro.role : "—"} ·{" "}
                      {formatDate(r.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-sm font-extrabold tabular-nums ${NPS_BADGE[category]}`}
                      title="Nota NPS (0 a 10)"
                    >
                      {r.nps_score}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r.id}
                      aria-label="Excluir resposta"
                      className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                        <path
                          d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.5 12a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1L7 7"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Critérios (estrelas) */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {STAR_CRITERIA.map(({ key, label }) => (
                    <span key={key}>
                      {label}:{" "}
                      <span className="font-semibold text-slate-700">
                        {r[key]}★
                      </span>
                    </span>
                  ))}
                </div>

                {/* Comentário */}
                {r.comentario && r.comentario.trim() && (
                  <p className="mt-2 rounded-xl bg-slate-50 p-2.5 text-sm text-slate-600">
                    “{r.comentario}”
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Formata a data em pt-BR (dd/mm/aaaa hh:mm). */
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import StatTile from "../dashboard/StatTile.jsx";
import NpsDistributionBar from "../dashboard/NpsDistributionBar.jsx";
import ProfessionalRanking from "../dashboard/ProfessionalRanking.jsx";
import ProfessionalDetail from "../dashboard/ProfessionalDetail.jsx";
import ProfessionalManager from "../dashboard/ProfessionalManager.jsx";
import ResponsesTable from "../dashboard/ResponsesTable.jsx";

import { fetchProfessionals } from "../../lib/api.js";
import { listResponses, deleteResponse } from "../../lib/adminApi.js";
import { adminLogout } from "../../lib/adminAuth.js";
import {
  computeMetrics,
  buildRanking,
  groupByProfessional,
  npsBand,
} from "../../lib/nps.js";

/**
 * Painel autenticado. Carrega profissionais (anon) + respostas (Edge Function)
 * e monta as três abas: Visão geral, Respostas e Profissionais.
 *
 * Props:
 *  - onLogout: () => void
 */
const TABS = [
  { key: "overview", label: "Visão geral" },
  { key: "responses", label: "Respostas" },
  { key: "manage", label: "Profissionais" },
];

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState("overview");
  const [selectedId, setSelectedId] = useState(null);

  const [professionals, setProfessionals] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /** Recarrega profissionais + respostas do backend. */
  const reload = useCallback(async () => {
    setError("");
    try {
      const [pros, resp] = await Promise.all([
        fetchProfessionals(),
        listResponses(),
      ]);
      setProfessionals(pros);
      setResponses(resp);
    } catch (e) {
      setError(e?.message || "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // ---- Agregações -----------------------------------------------------------
  const overall = useMemo(() => computeMetrics(responses), [responses]);
  const ranking = useMemo(
    () => buildRanking(professionals, responses),
    [professionals, responses]
  );
  const byPro = useMemo(() => groupByProfessional(responses), [responses]);

  const focusId = selectedId ?? ranking[0]?.professional.id ?? null;
  const focusRow = ranking.find((r) => r.professional.id === focusId) ?? null;
  const overallBand = npsBand(overall.nps);

  const handleLogout = () => {
    adminLogout();
    onLogout();
  };

  const handleDeleteResponse = async (id) => {
    await deleteResponse(id);
    await reload();
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      {/* Barra superior */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Consultoria André Froed
            </p>
            <h1 className="text-lg font-extrabold text-slate-800">
              Painel de satisfação (NPS)
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
            >
              Ver pesquisa
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="mx-auto max-w-5xl px-4">
          <nav className="flex gap-1" aria-label="Seções do painel">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <p className="py-16 text-center text-slate-500">Carregando dados…</p>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-3 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <div className="space-y-6">
                {/* KPIs gerais */}
                <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile
                    label="NPS geral"
                    value={`${overall.nps > 0 ? "+" : ""}${overall.nps}`}
                    hint={overallBand.label}
                    tone={overallBand.tone}
                  />
                  <StatTile label="Respostas" value={overall.total} tone="brand" />
                  <StatTile
                    label="Média ★"
                    value={overall.starAvg.toFixed(1)}
                    hint="de 5,0"
                    tone="amber"
                  />
                  <StatTile
                    label="Profissionais"
                    value={professionals.length}
                    tone="slate"
                  />
                </section>

                {/* Distribuição geral */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="mb-3 text-sm font-semibold text-slate-600">
                    Distribuição geral das notas
                  </h2>
                  <NpsDistributionBar
                    percents={overall.percents}
                    counts={overall.counts}
                  />
                </section>

                {/* Ranking + Detalhe */}
                <section className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-slate-600">
                      Ranking por NPS
                    </h2>
                    {ranking.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                        Nenhum profissional cadastrado.
                      </p>
                    ) : (
                      <ProfessionalRanking
                        ranking={ranking}
                        selectedId={focusId}
                        onSelect={setSelectedId}
                      />
                    )}
                  </div>

                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-slate-600">
                      Detalhe do profissional
                    </h2>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      {focusRow ? (
                        <ProfessionalDetail
                          professional={focusRow.professional}
                          metrics={focusRow.metrics}
                          responses={byPro.get(focusRow.professional.id) ?? []}
                        />
                      ) : (
                        <p className="text-sm text-slate-400">
                          Nenhum profissional para exibir.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {tab === "responses" && (
              <ResponsesTable
                responses={responses}
                professionals={professionals}
                onDelete={handleDeleteResponse}
              />
            )}

            {tab === "manage" && (
              <ProfessionalManager
                professionals={professionals}
                onChanged={reload}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

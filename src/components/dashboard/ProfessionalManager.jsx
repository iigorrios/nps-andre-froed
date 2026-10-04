import Avatar from "../Avatar.jsx";
import { ROLE_LABELS } from "../../data/professionals.mock.js";

/**
 * Profissionais que aparecem na pesquisa (nutricionistas e personais).
 *
 * A lista é mantida pelo sistema central de Acessos: entra quem está ATIVO e
 * tem a área "Nutrição" ou "Treino (Personal)". Nome e foto também vêm de lá.
 * Desativar a pessoa no Acessos tira ela da pesquisa; o histórico de notas fica.
 *
 * Props:
 *  - professionals: lista atual (vem do painel)
 */
const ACESSOS_URL = "https://acessos.andrefroed.com.br";

export default function ProfessionalManager({ professionals }) {
  const ativos = professionals.filter((p) => p.active !== false);
  const inativos = professionals.filter((p) => p.active === false);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-800">A lista de profissionais agora vem do sistema de Acessos.</p>
        <p className="mt-1">
          Para incluir alguém, cadastre a pessoa no Acessos com a área <b>Nutrição</b> ou <b>Treino (Personal)</b>.
          Para tirar da pesquisa, desative a pessoa lá. Nome e foto também são editados no Acessos.
        </p>
        <a href={ACESSOS_URL} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-brand-700 underline">
          Abrir Acessos
        </a>
      </div>

      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {ativos.map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-3">
            <Avatar name={p.name} photo={p.photo} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{p.name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[p.role] ?? p.role}</p>
            </div>
          </li>
        ))}
        {ativos.length === 0 && <li className="p-4 text-sm text-slate-500">Nenhum profissional ativo.</li>}
      </ul>

      {inativos.length > 0 && (
        <p className="text-xs text-slate-500">
          Fora da pesquisa (histórico mantido): {inativos.map((p) => p.name).join(", ")}
        </p>
      )}
    </section>
  );
}

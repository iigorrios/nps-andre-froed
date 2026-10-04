import { useState } from "react";
import { Link } from "react-router-dom";
import { adminLogin } from "../../lib/adminAuth.js";
import { isSupabaseConfigured } from "../../lib/supabaseClient.js";

/**
 * Tela de acesso do painel: e-mail e senha do time. Quem pode entrar é
 * definido no sistema central de Acessos (sistema "nps").
 *
 * Props:
 *  - onSuccess: () => void  — chamado após login bem-sucedido
 */
export default function LoginGate({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await adminLogin(email, password);
      onSuccess();
    } catch (err) {
      setError(err?.message || "Não foi possível entrar.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Consultoria André Froed
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-800">
          Painel de NPS
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Área restrita. Entre com o seu login do time.
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Supabase não configurado. Preencha o <code>.env</code> antes de
            entrar.
          </div>
        )}

        <div className="mt-5">
          <label htmlFor="admin-email" className="block text-sm font-medium text-slate-600">
            E-mail
          </label>
          <input
            id="admin-email"
            type="email"
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-slate-800 placeholder:text-slate-400 focus:border-brand-400"
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="admin-password"
            className="block text-sm font-medium text-slate-600"
          >
            Senha
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-slate-800 placeholder:text-slate-400 focus:border-brand-400"
          />
        </div>

        {error && (
          <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password || !email}
          className="mt-5 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <Link
          to="/"
          className="mt-4 block text-center text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          ← Voltar para a pesquisa
        </Link>
      </form>
    </main>
  );
}

import { useEffect, useState } from "react";
import { papelNoPainel } from "../lib/adminAuth.js";
import LoginGate from "../components/admin/LoginGate.jsx";
import AdminDashboard from "../components/admin/AdminDashboard.jsx";

/**
 * /admin — painel protegido pelo login do time (permissão "nps" no Acessos).
 *
 * Mostra a tela de login enquanto não houver sessão válida; depois, o painel.
 * Papel "time" vê tudo, mas sem os botões de excluir.
 */
export default function AdminPage() {
  // undefined = carregando | null = sem acesso | "admin" / "time"
  const [papel, setPapel] = useState(undefined);

  useEffect(() => {
    papelNoPainel().then(setPapel);
  }, []);

  if (papel === undefined) {
    return <main className="flex min-h-[100dvh] items-center justify-center text-sm text-slate-500">Carregando...</main>;
  }
  if (!papel) return <LoginGate onSuccess={() => papelNoPainel().then(setPapel)} />;
  return <AdminDashboard podeApagar={papel === "admin"} onLogout={() => setPapel(null)} />;
}

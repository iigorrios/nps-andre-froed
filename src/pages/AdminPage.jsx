import { useEffect, useState } from "react";
import { isAdminAuthed } from "../lib/adminAuth.js";
import LoginGate from "../components/admin/LoginGate.jsx";
import AdminDashboard from "../components/admin/AdminDashboard.jsx";

/**
 * /admin — painel protegido pelo login do time (permissão "nps" no Acessos).
 *
 * Mostra a tela de login enquanto não houver sessão válida; depois, o painel.
 */
export default function AdminPage() {
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    isAdminAuthed().then(setAuthed);
  }, []);

  if (authed === null) {
    return <main className="flex min-h-[100dvh] items-center justify-center text-sm text-slate-500">Carregando...</main>;
  }
  if (!authed) return <LoginGate onSuccess={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}
